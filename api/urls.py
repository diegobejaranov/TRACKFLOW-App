from django.urls import path
from . import views

urlpatterns = [
    path('projects/', views.project_list, name='project_list'),
    path('projects/create/', views.create_project, name='create_project'),
    path('projects/<int:project_id>/', views.project_detail, name='project_detail'),
    path('projects/<int:project_id>/delete/', views.delete_project, name='delete_project'), 
    path('projects/<int:project_id>/upload-song/', views.upload_song_version, name='upload_song_version'),
    path('songs/<int:song_id>/delete/', views.delete_song, name='delete_song'),
    path('songs/<int:song_id>/status/', views.update_song_status, name='update_song_status'),
    path('audio-versions/<int:version_id>/comment/', views.create_timestamp_comment, name='create_comment'),
    path('login/', views.login_view, name='login'),
]