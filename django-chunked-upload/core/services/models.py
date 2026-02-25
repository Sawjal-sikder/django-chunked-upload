import uuid
import os
from datetime import datetime

from django.conf import settings
from django.db import models


def chunked_upload_to(instance, filename):
    path = getattr(settings, "CHUNKED_UPLOAD_PATH", "chunked_uploads/%Y/%m/%d")
    return os.path.join(datetime.now().strftime(path), filename)


class ChunkedUpload(models.Model):
    UPLOADING = 1
    COMPLETE = 2
    STATUS_CHOICES = [
        (UPLOADING, "Uploading"),
        (COMPLETE, "Complete"),
    ]

    upload_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    file = models.FileField(upload_to=chunked_upload_to)
    filename = models.CharField(max_length=255)
    offset = models.BigIntegerField(default=0)
    status = models.PositiveSmallIntegerField(choices=STATUS_CHOICES, default=UPLOADING)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.filename} [{self.get_status_display()}]"

    def append_chunk(self, chunk):
        self.file.open(mode="ab")
        for subchunk in chunk.chunks():
            self.file.write(subchunk)
        self.offset = self.file.size
        self.file.close()
        self.save()
