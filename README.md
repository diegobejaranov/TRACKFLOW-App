# 🎛️ TrackFlow App

**TrackFlow** is a collaborative fullstack web platform designed for music producers, musicians, and clients to streamline audio production workflows, track song versions, and leave timestamped technical feedback directly on audio waveforms.

---

## ✨ Key Features

- Role-Based Access Control (RBAC):** Granular permission system powered by Django Groups supporting three distinct workflows:
        - Producers:** Create/delete projects, manage song lifecycle statuses (*Composition, Recording, Editing, Mixing, Mastering, Approved*), and upload new tracks or versions.
        - Musicians:** Upload new audio versions (`v1`, `v2`, etc.) to existing tracks and collaborate on feedback.
        - Clients:** Listen to mixes, review progress, and leave timestamped comments without altering production files or statuses.
  
- Interactive Waveform Audio Player:** Built with **WaveSurfer.js**, allowing users to visualize audio tracks, click anywhere on the waveform to pin exact timestamps, and jump directly to specific moments from feedback comments.

- Audio Version Control:** Keep a structured history of every mix and iteration per song without losing previous versions or their associated feedback.

- Real-Time Production Status Tracking:** Visual indicators at both the song and project level showing whether a project is *In Progress* or *100% Completed*.

- Cloud Persistence & Timezone Synchronization:** Media files are stored persistently via **Cloudinary**, relational data runs on **PostgreSQL**, and all timestamps are synchronized to local time (`America/Bogota`).

---

## 🛠️ Tech Stack

### Backend
- Framework:** Python / Django
- Database:** PostgreSQL (Production) / SQLite3 (Local Development)
- Media Storage:** Cloudinary
- Security & Config:** Django Session Authentication, RBAC Permissions, `django-cors-headers`, `django-environ`

### Frontend
- Library:** React (Vite)
- Audio Engine:** WaveSurfer.js
- Styling & Icons:** Tailwind CSS, Lucide React

### Deployment
- Cloud Hosting:** Render (Frontend Static Site + Backend Web Service + Managed PostgreSQL)

---

## 📂 Project Structure


trackflow/
├── backend/
│   ├── core/
│   ├── media/
│   ├── projects/
│   ├── db.sqlite3
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── AudioPlayer.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   └── ProjectList.jsx
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md

---

🚀 Local Setup & Installation
Prerequisites
- Python 3.10+
- Node.js 18+
- A Cloudinary account for audio storage

1. Clone the Repository
git clone [https://github.com/your-username/trackflow.git](https://github.com/your-username/trackflow.git)
cd trackflow


2. Backend Setup (Django)   
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

*Create a .env file inside the backend/ directory:
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:5173
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

*Run migrations and start the development server:
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver


3. Frontend Setup (React)
*Open a new terminal window:
cd frontend
npm install

*Create a .env file inside the frontend/ directory:
VITE_API_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)

*Start the Vite development server:
Bash
npm run dev

---

🔒 Security Overview
- Password Hashing: Uses Django's default PBKDF2 algorithm with SHA-256 hashing and per-user cryptographic salts.

- SQL Injection Prevention: All database queries are parameterized natively through the Django ORM.

- XSS Protection: Automatic DOM escaping enforced across React components.

- Environment Isolation: All API keys, database URLs, and secret keys are injected via environment variables and excluded from version control.

- Encrypted Transport: Deployed over HTTPS with managed SSL/TLS certificates on Render.

---

📄 License
Developed as a ConquerBlocks Fullstack Master's Final Project (2026). All rights reserved.
