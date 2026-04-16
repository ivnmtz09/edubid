from rest_framework.routers import DefaultRouter
from .views import ActivityViewSet, SubmissionViewSet

router = DefaultRouter()
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'submissions', SubmissionViewSet, basename='submission')

urlpatterns = router.urls
