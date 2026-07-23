from django.contrib import admin
from .models import Project, Member, Task, ChatMessage

# Register your models here.
admin.site.register(Project)
admin.site.register(Member)
admin.site.register(Task)
admin.site.register(ChatMessage)
