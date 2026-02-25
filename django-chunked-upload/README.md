# Django Chunked Video Upload API

Upload large video files in multiple chunks using Django REST Framework.

## Setup

```bash
cd core
pip install django djangorestframework
python manage.py migrate
python manage.py runserver
```

## Configuration

In `settings.py`:

```python
CHUNKED_UPLOAD_PATH = "chunked_uploads/%Y/%m/%d"   # Upload directory
CHUNKED_UPLOAD_MAX_BYTES = 1048576000               # Max file size (1GB)
```

---

## API Endpoints

Base URL: `http://127.0.0.1:8000/api/`

### 1. Upload Chunk — `POST /api/upload/`

Upload file chunks using `multipart/form-data`.

#### Start a new upload (first chunk)

| Field      | Type   | Required | Description                          |
|------------|--------|----------|--------------------------------------|
| `file`     | File   | Yes      | The chunk binary data                |
| `filename` | String | No       | Original filename (defaults to file name) |

**Request:**

```bash
curl -X POST http://127.0.0.1:8000/api/upload/ \
  -F "file=@chunk1.bin" \
  -F "filename=my_video.mp4"
```

**Response (200):**

```json
{
    "id": 1,
    "upload_id": "77cb1c48-b91b-46e0-9e9a-679dc80452e3",
    "file": "/media/chunked_uploads/2026/02/25/my_video.mp4",
    "filename": "my_video.mp4",
    "offset": 524288,
    "status": 1,
    "created_at": "2026-02-25T03:42:01.854079Z",
    "completed_at": null
}
```

#### Append next chunks

| Field       | Type   | Required | Description                     |
|-------------|--------|----------|---------------------------------|
| `file`      | File   | Yes      | The chunk binary data           |
| `upload_id` | UUID   | Yes      | The `upload_id` from first response |

**Request:**

```bash
curl -X POST http://127.0.0.1:8000/api/upload/ \
  -F "file=@chunk2.bin" \
  -F "upload_id=77cb1c48-b91b-46e0-9e9a-679dc80452e3"
```

**Response (200):**

```json
{
    "id": 1,
    "upload_id": "77cb1c48-b91b-46e0-9e9a-679dc80452e3",
    "file": "/media/chunked_uploads/2026/02/25/my_video.mp4",
    "filename": "my_video.mp4",
    "offset": 1048576,
    "status": 1,
    "created_at": "2026-02-25T03:42:01.854079Z",
    "completed_at": null
}
```

#### Errors

| Status | Response                                              | Cause                              |
|--------|-------------------------------------------------------|------------------------------------|
| 400    | `{"error": "No file provided."}`                      | Missing `file` field               |
| 400    | `{"error": "File size exceeds the limit."}`           | Total size exceeds max bytes       |
| 404    | `{"error": "Upload not found or already completed."}` | Invalid `upload_id` or already done |

---

### 2. Complete Upload — `POST /api/upload/complete/`

Mark the upload as complete after all chunks have been sent.

**Content-Type:** `application/json`

| Field       | Type | Required | Description                     |
|-------------|------|----------|---------------------------------|
| `upload_id` | UUID | Yes      | The `upload_id` from upload step |

**Request:**

```bash
curl -X POST http://127.0.0.1:8000/api/upload/complete/ \
  -H "Content-Type: application/json" \
  -d '{"upload_id": "77cb1c48-b91b-46e0-9e9a-679dc80452e3"}'
```

**Response (200):**

```json
{
    "message": "Upload complete.",
    "upload": {
        "id": 1,
        "upload_id": "77cb1c48-b91b-46e0-9e9a-679dc80452e3",
        "file": "/media/chunked_uploads/2026/02/25/my_video.mp4",
        "filename": "my_video.mp4",
        "offset": 1048576,
        "status": 2,
        "created_at": "2026-02-25T03:42:01.854079Z",
        "completed_at": "2026-02-25T03:42:08.751915Z"
    }
}
```

#### Errors

| Status | Response                                       | Cause                   |
|--------|-------------------------------------------------|------------------------|
| 400    | `{"error": "upload_id is required."}`           | Missing `upload_id`    |
| 400    | `{"error": "Upload already completed."}`        | Already marked complete |
| 404    | `{"error": "Upload not found."}`                | Invalid `upload_id`    |

---

## Status Codes

| Value | Meaning     |
|-------|-------------|
| `1`   | Uploading   |
| `2`   | Complete    |

## Upload Flow

```
Client                              Server
  |                                    |
  |-- POST /api/upload/ (chunk 1) ---->|  Creates upload, returns upload_id
  |<------------ 200 + upload_id ------|
  |                                    |
  |-- POST /api/upload/ (chunk 2) ---->|  Appends to file
  |<------------ 200 + offset ---------|
  |                                    |
  |-- POST /api/upload/ (chunk N) ---->|  Appends to file
  |<------------ 200 + offset ---------|
  |                                    |
  |-- POST /api/upload/complete/ ----->|  Marks as complete
  |<------------ 200 + upload data ----|
```

## JavaScript Example

```javascript
async function uploadVideoInChunks(file, chunkSize = 1024 * 1024) {
  const totalChunks = Math.ceil(file.size / chunkSize);
  let uploadId = null;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append("file", chunk);

    if (uploadId) {
      formData.append("upload_id", uploadId);
    } else {
      formData.append("filename", file.name);
    }

    const res = await fetch("/api/upload/", { method: "POST", body: formData });
    const data = await res.json();
    uploadId = data.upload_id;

    console.log(`Chunk ${i + 1}/${totalChunks} uploaded (${data.offset} bytes)`);
  }

  // Complete the upload
  const completeRes = await fetch("/api/upload/complete/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ upload_id: uploadId }),
  });

  return await completeRes.json();
}

// Usage: <input type="file" onchange="uploadVideoInChunks(this.files[0])">
```
