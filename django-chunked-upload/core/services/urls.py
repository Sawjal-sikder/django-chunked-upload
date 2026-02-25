from django.urls import path

from .views import ChunkedUploadView, ChunkedUploadCompleteView, UploadPageView, VideoListView

urlpatterns = [
    path("", UploadPageView.as_view(), name="upload_page"),
    path("upload/", ChunkedUploadView.as_view(), name="chunked_upload"),
    path("upload/complete/", ChunkedUploadCompleteView.as_view(), name="chunked_upload_complete"),
    path("videos/", VideoListView.as_view(), name="video_list"),
]
