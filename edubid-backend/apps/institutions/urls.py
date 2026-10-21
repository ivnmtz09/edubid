from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InstitutionViewSet, PublicInstitutionListView, PublicInstitutionBySlugView

router = DefaultRouter()
router.register(r'institutions', InstitutionViewSet, basename='institution')

urlpatterns = [
    path('institutions/public/', PublicInstitutionListView.as_view(), name='institutions-public'),
    path('institutions/by-slug/<slug:slug>/', PublicInstitutionBySlugView.as_view(), name='institution-by-slug'),
    path('', include(router.urls)),
]