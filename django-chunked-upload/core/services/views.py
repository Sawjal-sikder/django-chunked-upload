from django.conf import settings
from django.core.files.base import ContentFile
from django.shortcuts import render
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChunkedUpload
from .serializers import ChunkedUploadSerializer


class ChunkedUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        upload_id = request.data.get("upload_id")

        # Check max file size
        max_bytes = getattr(settings, "CHUNKED_UPLOAD_MAX_BYTES", None)

        if upload_id:
            # Append chunk to existing upload
            try:
                chunked_upload = ChunkedUpload.objects.get(upload_id=upload_id, status=ChunkedUpload.UPLOADING)
            except ChunkedUpload.DoesNotExist:
                return Response({"error": "Upload not found or already completed."}, status=status.HTTP_404_NOT_FOUND)

            if max_bytes and (chunked_upload.offset + file.size) > max_bytes:
                return Response({"error": "File size exceeds the limit."}, status=status.HTTP_400_BAD_REQUEST)

            chunked_upload.append_chunk(file)
        else:
            # Create new upload
            if max_bytes and file.size > max_bytes:
                return Response({"error": "File size exceeds the limit."}, status=status.HTTP_400_BAD_REQUEST)

            filename = request.data.get("filename", file.name)
            chunked_upload = ChunkedUpload(filename=filename)
            chunked_upload.file.save(filename, ContentFile(b""), save=False)
            chunked_upload.save()
            chunked_upload.append_chunk(file)

        serializer = ChunkedUploadSerializer(chunked_upload)
        return Response(serializer.data, status=status.HTTP_200_OK)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class UploadPageView(APIView):
    def get(self, request):
        return render(request, "upload.html")


class ChunkedUploadCompleteView(APIView):

    def post(self, request):
        upload_id = request.data.get("upload_id")
        if not upload_id:
            return Response({"error": "upload_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            chunked_upload = ChunkedUpload.objects.get(upload_id=upload_id)
        except ChunkedUpload.DoesNotExist:
            return Response({"error": "Upload not found."}, status=status.HTTP_404_NOT_FOUND)

        if chunked_upload.status == ChunkedUpload.COMPLETE:
            return Response({"error": "Upload already completed."}, status=status.HTTP_400_BAD_REQUEST)

        chunked_upload.status = ChunkedUpload.COMPLETE
        chunked_upload.completed_at = timezone.now()
        chunked_upload.save()

        serializer = ChunkedUploadSerializer(chunked_upload)
        return Response({"message": "Upload complete.", "upload": serializer.data}, status=status.HTTP_200_OK)


class VideoListView(ListAPIView):
    serializer_class = ChunkedUploadSerializer

    def get_queryset(self):
        return ChunkedUpload.objects.filter(status=ChunkedUpload.COMPLETE).order_by("-completed_at")
