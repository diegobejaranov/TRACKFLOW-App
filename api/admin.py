from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.text import Truncator
from .models import User, Project, Song, AudioVersion, TimestampComment

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'first_name', 'last_name', 'email', 'role')
    list_filter = ('role'),
    
    fieldsets = UserAdmin.fieldsets + (
        ('Información de Rol TrackFlow', {'fields': ('role',)}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información de Rol TrackFlow', {'fields': ('role',)}),
    )

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'description', 'creator', 'created_at')

@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'status')
    list_filter = ('status',)

admin.site.register(AudioVersion)

@admin.register(TimestampComment)
class TimestampCommentAdmin(admin.ModelAdmin):
    list_display = (
        'audio_version',
        'author',
        'short_text',
        'timestamp',
        'created_at',
    )
    readonly_fields = ('created_at',)

    @admin.display(description='Comentario')
    def short_text(self, obj):
        return Truncator(obj.text).chars(35)
    
  