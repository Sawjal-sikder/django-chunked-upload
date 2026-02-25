# Chunked File Upload

A full-stack chunked file upload application with a **Django REST Framework** backend and a **React (Vite)** frontend. Large files are split into 20 MB chunks on the client, uploaded sequentially, and reassembled on the server.

## Tech Stack

- **Backend:** Django 6, Django REST Framework, SQLite, Gunicorn
- **Frontend:** React 19, Vite 5
- **Containerization:** Docker, Docker Compose

## Project Structure

```
chunked-upload/
├── docker-compose.yml
├── django-chunked-upload/       # Backend
│   ├── Dockerfile
│   └── core/
│       ├── manage.py
│       ├── requirements.txt
│       ├── core/                # Django project settings & URLs
│       └── services/            # Upload app (models, views, serializers)
└── react-chunked-upload/        # Frontend
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.jsx
        ├── ChunkedUpload.jsx    # Upload component
        └── VideoList.jsx        # Video listing component
```

## API Endpoints

| Method | Endpoint               | Description                     |
|--------|------------------------|---------------------------------|
| POST   | `/api/upload/`         | Upload a file chunk             |
| POST   | `/api/upload/complete/`| Mark an upload as complete      |
| GET    | `/api/videos/`         | List all completed uploads      |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

## Run with Docker Compose

```bash
docker compose up --build
```

Once the containers are running:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api/

## Run Without Docker

### Backend

```bash
cd django-chunked-upload/core
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend will be available at http://localhost:8000.

### Frontend

```bash
cd react-chunked-upload
npm install
npm run dev
```

Frontend will be available at http://localhost:5173.

## Configuration

| Setting                    | Default          | Location                        |
|----------------------------|------------------|---------------------------------|
| Chunk size (client)        | 20 MB            | `react-chunked-upload/src/ChunkedUpload.jsx` |
| Max upload size (server)   | 1 GB             | `django-chunked-upload/core/core/settings.py` |
| Upload storage path        | `chunked_uploads/%Y/%m/%d` | `django-chunked-upload/core/core/settings.py` |
| CORS allowed origins       | `http://localhost:5173`    | `django-chunked-upload/core/core/settings.py` |
