from django.urls import path
from .views import CreateReportView

urlpatterns = [
    path('', CreateReportView.as_view(), name='create-report'),
]
