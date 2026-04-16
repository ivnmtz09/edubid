from rest_framework.routers import DefaultRouter
from .views import GradeViewSet

router = DefaultRouter()
router.register(r'', GradeViewSet, basename='grades')
urlpatterns = router.urls
