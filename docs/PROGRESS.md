# TalkCS — Project Progress

## What this project is
University forum platform (thesis project). Stack: Spring Boot 4 + PostgreSQL backend, React + Vite + TypeScript + Tailwind frontend.

## Repo structure
```
TalkCS/
├── backend/    Spring Boot API (port 8080)
├── frontend/   React app (port 5173)
└── docs/       Architecture + this file
```

## How to start everything
```bash
# 1. PostgreSQL
brew services start postgresql@16

# 2. Backend (from backend/)
./start.sh   # loads .env, kills :8080, runs ./gradlew bootRun

# 3. Frontend (from frontend/)
npm run dev
```

## What is built

### Auth (complete)
- `User` entity → `users` table
- Register (`POST /api/auth/register`) + Login (`POST /api/auth/login`)
- JWT auth — token stores the user's **email** as subject
- `UserLoader` looks up user by email for every authenticated request
- `SecurityConfig` — stateless sessions, CORS for localhost:5173/5174, `@EnableMethodSecurity` active
- Frontend: Login page, Register page, `AuthContext` (JWT + user stored in localStorage), `ProtectedRoute`

### Categories (complete)
- `Category` entity → `categories` table (id, name unique, description, createdAt)
- `CategoryRepository` — `existsByName()`
- `CategoryRequest` / `CategoryResponse` DTOs
- `CategoryService` — `getAllCategories()`, `createCategory()`, `getCategoryById()`
- `CategoryController`:
  - `GET /api/categories` — any authenticated user
  - `GET /api/categories/{id}` — any authenticated user
  - `POST /api/categories` — **ADMIN only** (`@PreAuthorize("hasRole('ADMIN')")`)
- Frontend: `src/api/categories.ts`, `HomePage.tsx` shows category list + admin create modal, clicking a category navigates to `/category/:id`

### Posts (complete)
- `Post` entity → `posts` table (id, title, body, createdAt, author `@ManyToOne User`, category `@ManyToOne Category`)
- `PostRepository` — `findByCategoryId()`
- `PostRequest` / `PostResponse` (includes `commentCount`, `authorUsername`) DTOs
- `PostService` — `getAllPostsByCategoryId()`, `createPost()`, `getPostById()`
- `PostController`:
  - `GET /api/posts?categoryId={id}` — any authenticated user
  - `POST /api/posts` — any authenticated user
  - `GET /api/posts/{id}` — any authenticated user
- Frontend: `src/api/posts.ts`, `CategoryPage.tsx` (lists posts, create post modal)

### Comments (complete)
- `Comment` entity → `comments` table (id, body, createdAt, author `@ManyToOne User`, post `@ManyToOne Post`, parent `@ManyToOne Comment` nullable for threading)
- `CommentRepository` — `countByPostId()`
- `CommentRequest` / `CommentResponse` (includes `children: List<CommentResponse>` for nested tree) DTOs
- `CommentService` — `getCommentsByPostId()`, `createComment()`
- `CommentController`:
  - `GET /api/comments?postId={id}` — any authenticated user
  - `POST /api/comments` — any authenticated user
- Frontend: `src/api/comments.ts`, `PostPage.tsx` (shows post, nested comments recursively, inline reply form)

## Current user in DB
- Email: `omar@uni.edu`, password: `password123`, role: `ADMIN`

## Important bugs fixed (don't repeat these)
- JWT token must store `user.getEmail()` as subject (not username) — `UserLoader` does `findByEmail`
- `@PreAuthorize` must use `hasRole('ADMIN')` not `hasAuthority('ADMIN')` — because `UserLoader` uses `.roles()` which prefixes with `ROLE_`

## What to build next
- User profile page
- Shared calendar feature

## Code style conventions
- Java: Lombok (`@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@RequiredArgsConstructor`), `jakarta.persistence.*`, `java.time.LocalDateTime` (not `java.util`)
- Field naming: camelCase (`categoryRepository` not `categoryrepository`)
- Git commits: plain messages, **no `feat:` / `docs:` / `fix:` prefixes ever**
- Frontend: Stack Overflow-style light theme (white cards, gray background, orange accents)

## AI behaviour preferences (read this carefully)
- **No conventional commit prefixes** — commit messages are plain English, e.g. `"Fix login error handling"` not `"fix: login error handling"`
- **Teaching style for Java** — when helping the user write backend code, explain concepts step by step without giving the full code away. The user is learning Spring Boot. Guide them to write it themselves and check/fix their code after.
- **No implementation plan artifacts** — the user doesn't want a plan document to review before every change. Just do it or give a quick verbal lead.
- **Don't open browser subagents** to check UI — the user will check the UI themselves.
- **Ask before making large design decisions** — e.g. if unsure about UI layout, ask a quick question instead of assuming.
- **Concise responses** — don't over-explain completed steps. Get to the point.
