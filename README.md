# TalkCS

A university forum platform built as a thesis project.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21 · Spring Boot 4 · Spring Security |
| Database | PostgreSQL 16 |
| Auth | JWT (jjwt 0.12.6) + BCrypt |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| HTTP Client | Axios |

## Features

- ✅ User registration and login with JWT authentication
- ✅ Password hashing with BCrypt
- ✅ Protected routes (frontend + backend)
- ✅ Persistent auth via localStorage
- 🔜 Forum categories
- 🔜 Posts and threads
- 🔜 Comments
- 🔜 Shared calendars

## Project Structure

```
TalkCS/
├── backend/          # Spring Boot API
├── frontend/         # React + Vite app
└── docs/             # Architecture documentation
```

## Getting Started

### Prerequisites

- Java 21
- PostgreSQL 16
- Node.js 18+

### Backend

1. Create a PostgreSQL database called `talkcs`
2. Create a `.env` file at the project root:

```
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_very_long_random_secret_key
```

3. Source the env and run:

```bash
set -a && source .env && set +a
cd backend && ./gradlew bootRun
```

Backend runs on `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive JWT token |
| * | `/api/**` | Required | All other routes require `Authorization: Bearer <token>` |
