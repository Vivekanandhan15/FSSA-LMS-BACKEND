# FSSA LMS Student Side

Student Learning Management System with FastAPI backend and Vanilla JS frontend.

## Project Structure

```
LMS_Student-side/
├── backend/            # FastAPI Backend
│   ├── routers/        # API Endpoints (auth, courses)
│   ├── tests/          # Test scripts
│   ├── database.py     # DB Connection
│   ├── main.py         # App Entry Point
│   └── models.py       # SQLAlchemy Models
├── frontend/           # Static Frontend
│   ├── assets/         # Images/Icons
│   ├── pages/          # HTML Files
│   ├── scripts/        # JavaScript Logic
│   └── styles/         # CSS Styles
└── venv/               # Virtual Environment
```

## Setup & Run

### 1. Prerequisites
- Python 3.9+
- PostgreSQL (`localhost:5432`, DB: `FSSA_LMS`, User: `postgres`, Pass: `AcademyRootPassword`)

### 2. Backend Setup
```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
# OR (Recommended to avoid environment issues)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
The API will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Frontend Setup
The frontend is decoupled and can be served by any static file server.

**Recommended: VS Code Live Server**
1. Open the project in VS Code.
2. Install the "Live Server" extension.
3. Right-click `frontend/index.html` (or `frontend/pages/login.html`) and select "Open with Live Server".
4. The app will typically run at [http://127.0.0.1:5500/frontend/pages/login.html](http://127.0.0.1:5500/frontend/pages/login.html).

**Alternative: Python http.server**
```bash
python -m http.server 5500
```
Then navigate to [http://localhost:5500/frontend/pages/login.html](http://localhost:5500/frontend/pages/login.html).

### 4. Configuration
If your backend is running on a different port or host, update `frontend/scripts/config.js`:
```javascript
export const API_BASE_URL = 'http://127.0.0.1:8000';
```

## Features
- **Authentication**: Mock Google Login (supports any token).
- **Course Management**: CRUD operations backed by PostgreSQL.
- **Student Dashboard**: Dynamic course listing.

## Testing
Run the verification script to test API endpoints:
```bash
python backend/tests/test_api.py
```
