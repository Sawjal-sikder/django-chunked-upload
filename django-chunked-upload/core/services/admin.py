from django.contrib import admin

from .models import ChunkedUpload


@admin.register(ChunkedUpload)
class ChunkedUploadAdmin(admin.ModelAdmin):
    list_display = ["upload_id", "filename", "status", "offset", "created_at", "completed_at"]
    list_filter = ["status"]
    search_fields = ["upload_id", "filename"]
    readonly_fields = ["upload_id", "offset", "created_at", "completed_at"]
