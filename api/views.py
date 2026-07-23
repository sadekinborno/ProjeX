# In api/views.py

from rest_framework import generics, permissions, serializers
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from .models import Project, Member, Task, ChatMessage
from .serializers import (
    UserSerializer, RegisterSerializer, ProjectSerializer, 
    MemberSerializer, AddMemberSerializer, TaskSerializer,
    ProjectDetailSerializer, ChatMessageSerializer
)
from rest_framework.authentication import TokenAuthentication
from .permissions import IsProjectAdmin, IsProjectMember
from rest_framework.decorators import api_view, permission_classes

# Register API
class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token.key
        })

# Login API
class LoginAPI(generics.GenericAPIView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                "user": UserSerializer(user).data,
                "token": token.key
            })
        else:
            return Response({"error": "Invalid Credentials"}, status=400)


# Project List/Create API
class ProjectListCreateAPI(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    authentication_classes = [TokenAuthentication]
    # Ensures that only authenticated users can access this endpoint.
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # This method filters the projects to return only those
        # where the current user is a member.
        user = self.request.user
        return Project.objects.filter(members__user=user)

    def perform_create(self, serializer):
        # This method is called when a new project is created.
        # It sets the 'created_by' field to the current user.
        project = serializer.save(created_by=self.request.user)
        # [cite_start]Automatically make the creator an 'Admin' member of the new project. [cite: 16]
        Member.objects.create(project=project, user=self.request.user, role='Admin')


class MemberAPIView(generics.ListCreateAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsProjectAdmin] # <-- Use your new custom permission

    def get_serializer_class(self):
        # Use AddMemberSerializer for POST, MemberSerializer for GET
        if self.request.method == 'POST':
            return AddMemberSerializer
        return MemberSerializer

    def get_queryset(self):
        # Return a list of all members for the requested project
        project_pk = self.kwargs['project_pk']
        return Member.objects.filter(project_id=project_pk)

    def perform_create(self, serializer):
        project_pk = self.kwargs['project_pk']
        project = get_object_or_404(Project, pk=project_pk)
        username = serializer.validated_data['username']
        user_to_add = get_object_or_404(User, username=username)

        # Check if user is already a member
        if Member.objects.filter(project=project, user=user_to_add).exists():
            raise serializers.ValidationError("User is already a member of this project.")

        # Add the new user as a 'Member'
        Member.objects.create(project=project, user=user_to_add, role='Member')


class TaskListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsProjectAdmin] # Only admins can create/see all tasks

    def get_queryset(self):
        # Return tasks for the specific project from the URL
        project_pk = self.kwargs['project_pk']
        return Task.objects.filter(project_id=project_pk)

    def perform_create(self, serializer):
        # When creating a task, automatically link it to the project from the URL
        project_pk = self.kwargs['project_pk']
        project = get_object_or_404(Project, pk=project_pk)
        serializer.save(project=project)


class ProjectDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectDetailSerializer
    authentication_classes = [TokenAuthentication]
    
    def get_permissions(self):
        # Allow members to view (GET), but only admins can update (PATCH/PUT) or delete (DELETE)
        if self.request.method == 'GET':
            return [IsProjectMember()]
        return [IsProjectAdmin()]
    
    def get_object(self):
        # Override to use pk from URL
        project_pk = self.kwargs.get('pk')
        return get_object_or_404(Project, pk=project_pk)


class MyTasksAPIView(generics.ListAPIView):
    serializer_class = TaskSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return only the tasks where the current user is listed in the 'assignees'
        queryset = Task.objects.filter(assignees=self.request.user)
        
        # Optional: Filter by project if project_id is provided in query params
        project_id = self.request.query_params.get('project_id', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset

class TaskUpdateAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Allow users to view/update/delete tasks from their projects
        user = self.request.user
        return Task.objects.filter(project__members__user=user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_project_admin(request, project_id):
    try:
        project = Project.objects.get(id=project_id)
        user = request.user
        
        # First check if user is the creator
        is_creator = project.created_by == user
        
        # Then check if user is an admin member
        is_admin = Member.objects.filter(
            project_id=project_id,
            user=user,
            role='Admin'
        ).exists()
        
        # Debug prints
        print(f"User: {user.username}")
        print(f"Project: {project.name}")
        print(f"Is Creator: {is_creator}")
        print(f"Is Admin: {is_admin}")
        
        return Response({
            'is_admin': is_creator or is_admin,
            'is_creator': is_creator,
            'message': 'Access granted'
        })
        
    except Project.DoesNotExist:
        return Response({
            'error': 'Project not found'
        }, status=404)
    except Exception as e:
        print(f"Error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=400)


# Chat Message API Views
class ChatMessageListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsProjectMember]  # Only project members can view/send messages

    def get_queryset(self):
        # Return chat messages for the specific project
        project_pk = self.kwargs['project_pk']
        return ChatMessage.objects.filter(project_id=project_pk).select_related('user')

    def perform_create(self, serializer):
        # When creating a message, link it to the project and current user
        project_pk = self.kwargs['project_pk']
        project = get_object_or_404(Project, pk=project_pk)
        serializer.save(project=project, user=self.request.user)


# Install djangorestframework
# RUN: pip install djangorestframework