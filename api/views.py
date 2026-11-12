import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Project, Song, AudioVersion, TimestampComment

User = get_user_model()

def format_colombia_time(dt, fmt='%Y-%m-%d %H:%M'):
    if not dt:
        return ''
    return timezone.localtime(dt).strftime(fmt)

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')

            user = authenticate(request, username=username, password=password)

            if user is not None:
                login(request, user)
                return JsonResponse({
                    'success': True,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'role': getattr(user, 'role', 'producer'),
                    }
                })
            else:
                return JsonResponse({'success': False, 'error': 'Credenciales inválidas'}, status=401)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'error': 'Método no permitido'}, status=405)


def project_list(request):
    projects = Project.objects.all().order_by('-created_at')
    data = []
    for p in projects:
        all_songs = p.songs.all()
        is_approved = all_songs.exists() and all(s.status == 'approved' for s in all_songs)

        data.append({
            'id': p.id,
            'title': p.title,
            'description': p.description,
            'creator': p.creator.username,
            'client': p.client.username if p.client else None,
            'is_approved': is_approved,
            'songs_count': all_songs.count(),
            'created_at': p.created_at.strftime('%Y-%m-%d %H:%M'),
        })
    return JsonResponse({'projects': data}, safe=False)


@csrf_exempt
def create_project(request):
    if request.method == 'POST':
        if not request.user.is_authenticated or not request.user.has_perm('api.add_project'):
            return JsonResponse({'error': 'No tienes permisos para crear proyectos.'}, status=403)

        try:
            data = json.loads(request.body)
            project = Project.objects.create(
                title=data.get('title'),
                description=data.get('description', ''),
                creator=request.user
            )
            return JsonResponse({
                'success': True,
                'project': {
                    'id': project.id,
                    'title': project.title,
                    'description': project.description,
                    'creator': project.creator.username,
                    'is_approved': False,
                    'created_at': project.created_at.strftime('%Y-%m-%d %H:%M'),
                }
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Método no permitido'}, status=405)


def project_detail(request, project_id):
    try:
        project = Project.objects.get(pk=project_id)
        songs = project.songs.all()

        songs_data = []
        for song in songs:
            versions = song.versions.all().order_by('-version_number')
            versions_data = []
            for ver in versions:
                comments = ver.comments.all().order_by('timestamp')
                comments_data = [{
                    'id': c.id,
                    'timestamp_seconds': c.timestamp,
                    'text': c.text,
                    'author': c.author.username,
                    'created_at': c.created_at.strftime('%H:%M:%S')
                } for c in comments]

                versions_data.append({
                    'id': ver.id,
                    'version_number': ver.version_number,
                    'audio_file': ver.audio_file.url if ver.audio_file else '',
                    'uploaded_by': ver.uploaded_by.username,
                    'created_at': ver.created_at.strftime('%Y-%m-%d %H:%M'),
                    'comments': comments_data
                })

            songs_data.append({
                'id': song.id,
                'title': song.title,
                'bpm': song.bpm,
                'key': song.key,
                'status': song.status,
                'status_display': song.get_status_display(),
                'versions': versions_data
            })

        return JsonResponse({
            'id': project.id,
            'title': project.title,
            'description': project.description,
            'creator': project.creator.username,
            'songs': songs_data
        })
    except Project.DoesNotExist:
        return JsonResponse({'error': 'Proyecto no encontrado'}, status=404)


@csrf_exempt
def upload_song_version(request, project_id):
    if request.method == 'POST':
        if not request.user.is_authenticated or not request.user.has_perm('api.add_audioversion'):
            return JsonResponse({'error': 'No tienes permisos para subir archivos de audio.'}, status=403)

        try:
            project = Project.objects.get(pk=project_id)
            song_id = request.POST.get('song_id')
            audio_file = request.FILES.get('audio_file')
            bpm = request.POST.get('bpm')
            key = request.POST.get('key')

            if song_id and song_id != 'new':
                song = Song.objects.get(pk=song_id)
                if bpm: song.bpm = int(bpm)
                if key: song.key = key
                song.save()
            else:
                if not request.user.has_perm('api.add_song'):
                    return JsonResponse({'error': 'No tienes permisos para crear canciones nuevas, solo subir versiones.'}, status=403)

                song_title = request.POST.get('song_title', 'Nueva Canción')
                song = Song.objects.create(
                    project=project,
                    title=song_title,
                    bpm=int(bpm) if bpm else None,
                    key=key if key else ''
                )

            last_version = song.versions.order_by('-version_number').first()
            new_version_num = (last_version.version_number + 1) if last_version else 1

            version = AudioVersion.objects.create(
                song=song,
                version_number=new_version_num,
                audio_file=audio_file,
                uploaded_by=request.user
            )

            return JsonResponse({'success': True, 'song_id': song.id, 'version_id': version.id})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Método no permitido'}, status=405)


@csrf_exempt
def delete_project(request, project_id):
    if request.method == 'DELETE':
        if not request.user.is_authenticated or not request.user.has_perm('api.delete_project'):
            return JsonResponse({'error': 'No tienes permisos para eliminar proyectos.'}, status=403)

        try:
            project = Project.objects.get(pk=project_id)
            project.delete()
            return JsonResponse({'success': True, 'message': 'Proyecto eliminado correctamente'})
        except Project.DoesNotExist:
            return JsonResponse({'error': 'El proyecto no existe'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Método no permitido'}, status=405)


@csrf_exempt
def delete_song(request, song_id):
    if request.method == 'DELETE':
        if not request.user.is_authenticated or not request.user.has_perm('api.delete_song'):
            return JsonResponse({'error': 'No tienes permisos para eliminar canciones.'}, status=403)

        try:
            song = Song.objects.get(pk=song_id)
            song.delete()
            return JsonResponse({'success': True, 'message': 'Canción eliminada correctamente'})
        except Song.DoesNotExist:
            return JsonResponse({'error': 'La canción no existe'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Método no permitido'}, status=405)


@csrf_exempt
def update_song_status(request, song_id):
    if request.method == 'POST':
        if not request.user.is_authenticated or not request.user.has_perm('api.change_song'):
            return JsonResponse({'error': 'No tienes permisos para modificar el estado.'}, status=403)

        try:
            body = json.loads(request.body)
            song = Song.objects.get(pk=song_id)
            song.status = body.get('status')
            song.save()

            project = song.project
            all_songs = project.songs.all()
            project_approved = all_songs.exists() and all(s.status == 'approved' for s in all_songs)

            return JsonResponse({
                'success': True,
                'song_id': song.id,
                'new_status': song.status,
                'project_approved': project_approved
            })
        except Song.DoesNotExist:
            return JsonResponse({'error': 'La canción no existe'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Método no permitido'}, status=405)


@csrf_exempt
def create_timestamp_comment(request, version_id):
    if request.method == 'POST':
        if not request.user.is_authenticated or not request.user.has_perm('api.add_timestampcomment'):
            return JsonResponse({'error': 'No tienes permisos para comentar.'}, status=403)

        try:
            body = json.loads(request.body)
            version = AudioVersion.objects.get(pk=version_id)

            comment = TimestampComment.objects.create(
                audio_version=version,
                author=request.user,
                timestamp=float(body.get('timestamp_seconds', 0)),
                text=body.get('text')
            )

            return JsonResponse({
                'success': True,
                'comment': {
                    'id': comment.id,
                    'timestamp_seconds': comment.timestamp,
                    'text': comment.text,
                    'author': comment.author.username,
                    'created_at': format_colombia_time(comment.created_at, '%H:%M:%S')
                }
            })
        except AudioVersion.DoesNotExist:
            return JsonResponse({'error': 'Versión de audio no encontrada'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Método no permitido'}, status=405)