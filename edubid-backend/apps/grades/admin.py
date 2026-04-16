from django.contrib import admin
from .models import Grade

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ("student", "activity", "nota", "creado")
    search_fields = ("student__email", "activity__nombre")
