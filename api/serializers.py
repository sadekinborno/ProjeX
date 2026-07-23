# In api/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User  # <-- MAKE SURE THIS IMPORT IS HERE
from .models import Project, Member, Task, ChatMessage

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

# Register Serializer
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            validated_data['username'],
            validated_data['email'],
            validated_data['password']
        )
        return user


# Project Serializers
class ProjectSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'project_type', 'created_by', 'created_at', 'start_date', 'end_date']

# Member Serializers
class AddMemberSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)

class MemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Member
        fields = ['id', 'username', 'role']

# Task Serializer
class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    assignees = serializers.SlugRelatedField(
        many=True,
        slug_field='username',
        queryset=User.objects.all() # This line needs the 'User' model
    )

    class Meta:
        model = Task
        # Add 'description' and 'priority' to the fields list
        fields = ['id', 'title', 'project_name', 'description', 'status', 'priority', 'assignees', 'start_date', 'due_date']

# Project Detail Serializer (with nested serializers)
class ProjectDetailSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    members = MemberSerializer(many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'project_type', 'created_by', 'created_at', 'start_date', 'end_date', 'members', 'tasks']


# Chat Message Serializers
class ChatMessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'project', 'user_id', 'username', 'message', 'created_at']
        read_only_fields = ['id', 'user_id', 'username', 'created_at']