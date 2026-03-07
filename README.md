# TalkCS

A university forum platform built as a thesis project.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21 · Spring Boot 4 · Spring Security 6 |
| Database | PostgreSQL 16 |
| Auth | JWT (jjwt 0.12.6) + BCrypt |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| HTTP Client | Axios |

## Features

- ✅ User registration and login with JWT authentication
- ✅ Password hashing with BCrypt
- ✅ Protected routes (frontend + backend)
- ✅ Persistent auth via localStorage
- ✅ Forum categories (admin-only creation)
- ✅ Posts per category (any authenticated user)
- ✅ Nested threaded comments with replies
- 🔜 User profile page
- 🔜 Shared calendars

## Project Structure

```
TalkCS/
├── backend/          # Spring Boot API
├── frontend/         # React + Vite app
└── docs/             # Architecture & progress docs
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

3. Run using the start script (from `backend/`):

```bash
./start.sh
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
| GET | `/api/categories` | Required | List all categories |
| POST | `/api/categories` | ADMIN only | Create a category |
| GET | `/api/categories/{id}` | Required | Get a category by ID |
| GET | `/api/posts?categoryId={id}` | Required | Get posts in a category |
| POST | `/api/posts` | Required | Create a post |
| GET | `/api/posts/{id}` | Required | Get a post by ID |
| GET | `/api/comments?postId={id}` | Required | Get comments on a post (nested) |
| POST | `/api/comments` | Required | Create a comment or reply |
