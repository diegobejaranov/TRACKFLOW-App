from django.contrib.auth.models import AbstractUser
from django.db import models


# 1. Usuario con roles diferenciados (Músico, Productor, Cliente)
class User(AbstractUser):
    ROLE_CHOICES = (
        ('musician', 'Músico'),
        ('producer', 'Productor'),
        ('client', 'Cliente'),
    )
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES
    )

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to',
        related_name='custom_user_set',  
        related_query_name='custom_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='custom_user_permissions_set',  
        related_query_name='custom_user',
    )

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'


# 2. Proyecto musical 
class Project(models.Model):
    title = models.CharField(max_length=100, verbose_name='Título del Proyecto')
    description = models.TextField(blank=True, null=True, verbose_name='Descripción / Artista')
    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_projects',
        verbose_name='Creador',
    )
    client = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='client_projects',
        verbose_name='Cliente Asignado',
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name='Fecha de Creación'
    )

    def __str__(self):
        return self.title


# 3. Tema musical asociado a un proyecto
class Song(models.Model):   
    PRODUCTION_STATUS = (
        ('composition', 'Composición'),
        ('recording', 'Grabación'),
        ('editing', 'Edición'),
        ('mixing', 'Mezcla'),
        ('mastering', 'Masterización'),
        ('approved', 'Terminada'),
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='songs',
        verbose_name='Proyecto',
    )
    title = models.CharField(max_length=200, verbose_name='Título del Tema')
    bpm = models.IntegerField(blank=True, null=True, verbose_name='BPM')
    key = models.CharField(
        max_length=20, blank=True, null=True, verbose_name='Tonalidad'
    )
    duration = models.CharField(
        max_length=10, blank=True, null=True, verbose_name='Duración'
    )  
    status = models.CharField(
        max_length=30,
        choices=PRODUCTION_STATUS,
        default='composition',
        verbose_name='Estado',
    )

    def __str__(self):
        return f'{self.project.title} - {self.title}'


# 4. Archivo MP3 específico para una canción (Control de versiones)
class AudioVersion(models.Model):
    song = models.ForeignKey(
        Song,
        on_delete=models.CASCADE,
        related_name='versions',
        verbose_name='Canción',
    )
    version_number = models.IntegerField(
        verbose_name='Número de Versión'
    )  
    audio_file = models.FileField(
        upload_to='audio_versions/', 
        verbose_name='Archivo MP3'
    )
    uploaded_by = models.ForeignKey(
        User, on_delete=models.CASCADE, verbose_name='Subido por'
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name='Fecha de Subida'
    )

    def __str__(self):
        return f'{self.song.title} - v{self.version_number}'


# 5. Comentarios de feedback vinculados a un segundo exacto
class TimestampComment(models.Model):
    audio_version = models.ForeignKey(
        AudioVersion,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Versión de Audio',
    )
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, verbose_name='Autor'
    )
    timestamp = models.FloatField(
        verbose_name='Segundo Exacto'
    )  
    text = models.TextField(verbose_name='Comentario')
    is_resolved = models.BooleanField(
        default=False, verbose_name='Resuelto'
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name='Fecha'
    )

    def __str__(self):
        return f'Min {self.timestamp}s - {self.author.username}: {self.text[:30]}...'