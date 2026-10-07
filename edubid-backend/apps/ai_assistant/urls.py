from django.urls import path
from .views import ChatAiView, AiSuggestionsView

app_name = 'ai_assistant'

urlpatterns = [
    path('chat/', ChatAiView.as_view(), name='ai-chat'),
    path('suggestions/', AiSuggestionsView.as_view(), name='ai-suggestions'),
]
