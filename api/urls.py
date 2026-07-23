# In api/urls.py

from django.urls import path
from .views import RegisterAPI, LoginAPI, ProjectListCreateAPI, MemberAPIView, TaskListCreateAPIView, ProjectDetailAPIView, MyTasksAPIView, TaskUpdateAPIView, check_project_admin, ChatMessageListCreateAPIView


urlpatterns = [
    path('register/', RegisterAPI.as_view(), name='register'),
    path('login/', LoginAPI.as_view(), name='login'),
    path('projects/', ProjectListCreateAPI.as_view(), name='project-list-create'),
    path('projects/<int:pk>/', ProjectDetailAPIView.as_view(), name='project-detail'),
    path('projects/<int:project_pk>/members/', MemberAPIView.as_view(), name='project-members'),
    path('projects/<int:project_pk>/tasks/', TaskListCreateAPIView.as_view(), name='project-tasks'),
    path('projects/<int:project_pk>/chat/', ChatMessageListCreateAPIView.as_view(), name='project-chat'),
    path('mytasks/', MyTasksAPIView.as_view(), name='my-tasks'),
    path('tasks/<int:pk>/', TaskUpdateAPIView.as_view(), name='task-update'),  # New endpoint
    path('projects/<int:project_id>/check-admin/', check_project_admin, name='check-project-admin'),
]