from rest_framework import serializers

from .models import ChunkedUpload


class ChunkedUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChunkedUpload
        fields = ["id", "upload_id", "file", "filename", "offset", "status", "created_at", "completed_at"]
