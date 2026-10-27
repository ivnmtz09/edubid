from django.urls import path
from .views import ChatAiView, AiSuggestionsView, AiActionConfirmView, AiActionCancelView

app_name = 'ai_assistant'

urlpatterns = [
    path('chat/', ChatAiView.as_view(), name='ai-chat'),
    path('suggestions/', AiSuggestionsView.as_view(), name='ai-suggestions'),
    path('actions/<int:action_id>/confirm/', AiActionConfirmView.as_view(), name='ai-action-confirm'),
    path('actions/<int:action_id>/cancel/', AiActionCancelView.as_view(), name='ai-action-cancel'),
]
