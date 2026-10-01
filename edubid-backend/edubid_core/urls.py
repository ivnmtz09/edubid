from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def home_view(request):
    return JsonResponse({
        "status": "online",
        "message": "Bienvenido a la API de EduBid",
        "admin": "/admin/",
        "version": "1.0.0"
    })

urlpatterns = [ 
    path('', home_view, name='home'),
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),  # django-allauth
    path('api/users/', include('apps.users.urls')), 
    path('api/classrooms/', include('apps.classrooms.urls')),
    path('api/groups/', include('apps.groups.urls')), 
    path('api/', include('apps.activities.urls')),
    path('api/grades/', include('apps.grades.urls')), 
    path('api/tokens/', include('apps.tokens.urls')), 
    path('api/auctions/', include('apps.auctions.urls')), 
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/', include('apps.institutions.urls')),
]

from django.views.static import serve
from django.urls import re_path

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]