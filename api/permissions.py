# In api/permissions.py

from rest_framework import permissions
from .models import Member, Project

class IsProjectAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admins of a project to edit it.
    """
    def has_permission(self, request, view):
        # Get the project_pk from the URL (could be 'pk' or 'project_pk')
        project_pk = view.kwargs.get('project_pk') or view.kwargs.get('pk')
        
        if not project_pk:
            return False
            
        try:
            # Check if the user is the creator of the project
            project = Project.objects.get(pk=project_pk)
            if project.created_by == request.user:
                return True
            
            # Check if the user is a member and if their role is 'Admin'
            member = Member.objects.get(project_id=project_pk, user=request.user)
            return member.role == 'Admin'
        except (Member.DoesNotExist, Project.DoesNotExist):
            return False


class IsProjectMember(permissions.BasePermission):
    """
    Custom permission to only allow members of a project to view it.
    """
    def has_permission(self, request, view):
        project_pk = view.kwargs.get('pk') or view.kwargs.get('project_pk')
        try:
            return Member.objects.filter(project_id=project_pk, user=request.user).exists()
        except Member.DoesNotExist:
            return False