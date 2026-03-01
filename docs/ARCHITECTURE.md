# TalkCS — Project Architecture

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Java 21 · Spring Boot 4.0.3         |
| Build Tool | Gradle Kotlin DSL                   |
| Database   | PostgreSQL 16                       |
| Auth       | JWT (jjwt 0.12.6) + Spring Security |
| Frontend   | React 18 + TypeScript + Vite *(pending)* |

---

## Backend Structure

```
backend/src/main/java/com/talkcs/backend/
│
├── BackendApplication.java        ← App entry point
│
├── model/
│   └── User.java                  ← JPA entity → maps to `users` table in PostgreSQL
│
├── repository/
│   └── UserRepository.java        ← Database access layer for User
│
├── dto/
│   ├── RegisterRequest.java       ← Data the frontend sends to register
│   ├── LoginRequest.java          ← Data the frontend sends to login
│   └── AuthResponse.java          ← Data the backend returns after login (includes JWT token)
│
├── security/
│   ├── JwtUtils.java              ← Generates, validates, and reads JWT tokens
│   └── JwtAuthFilter.java         ← Intercepts every request and validates the JWT token
│
├── service/
│   └── AuthService.java           ← Business logic for register and login
│
└── config/
    └── SecurityConfig.java        ← Spring Security configuration (routes, JWT, BCrypt)
```

---

## File Descriptions

### `BackendApplication.java`
The main entry point of the Spring Boot application. Contains the `main()` method that starts the server on port `8080`.

---

### `model/User.java`
A JPA entity that maps directly to the `users` table in PostgreSQL. Hibernate reads this class and auto-creates/updates the table schema.

| Field       | Type          | Description                        |
|-------------|---------------|------------------------------------|
| id          | Long          | Primary key, auto-incremented      |
| username    | String        | Unique username                    |
| email       | String        | Unique email (used for login)      |
| password    | String        | BCrypt hashed password             |
| role        | String        | `"STUDENT"` or `"ADMIN"`          |
| createdAt   | LocalDateTime | Timestamp of account creation      |

---

### `repository/UserRepository.java`
Extends `JpaRepository<User, Long>` — provides full CRUD operations automatically. Also declares custom query methods:
- `findByEmail(email)` → used during login to look up the user
- `existsByEmail(email)` → checks for duplicate email during registration
- `existsByUsername(username)` → checks for duplicate username during registration

Spring Data JPA generates the SQL from the method names automatically.

---

### `dto/RegisterRequest.java`
Defines the body of a `POST /api/auth/register` request. Fields:
- `username` — `@NotBlank`
- `email` — `@NotBlank` `@Email`
- `password` — `@NotBlank` `@Size(min=8)`

---

### `dto/LoginRequest.java`
Defines the body of a `POST /api/auth/login` request. Fields:
- `email` — `@NotBlank` `@Email`
- `password` — `@NotBlank`

---

### `dto/AuthResponse.java`
What the backend sends back after a successful login:
- `token` — the JWT token the frontend must store and send with every future request
- `username`, `email`, `role` — basic user info for the frontend to display/use

---

### `security/JwtUtils.java`
A utility class (`@Component`) for JWT operations:
- `generateToken(username)` → builds and signs a JWT valid for 24 hours
- `getUsernameFromToken(token)` → extracts the username from inside a token
- `validateToken(token)` → returns `true` if valid, `false` if expired/tampered

Uses the `JWT_SECRET` environment variable (never hardcoded) via `@Value`.

---

### `security/JwtAuthFilter.java`
Extends `OncePerRequestFilter` — runs on every incoming HTTP request.

Flow:
1. Read `Authorization: Bearer <token>` header
2. If missing → pass request through unchanged (public route)
3. Validate the token via `JwtUtils`
4. If valid → extract username → load user from DB → set as authenticated in `SecurityContext`
5. Pass request to the next filter/controller

This is what makes protected routes work — controllers don't check tokens themselves, the filter does it for them.

---

### `service/AuthService.java`
Business logic layer for authentication:

**`register(RegisterRequest)`**
1. Check email not already taken → throw error if it is
2. Check username not already taken → throw error if it is
3. Hash the password with BCrypt
4. Build and save the `User` to the database
5. Return success message

**`login(LoginRequest)`**
1. Find user by email → throw `"Invalid credentials"` if not found
2. Verify password matches hash → throw `"Invalid credentials"` if wrong
3. Generate JWT token via `JwtUtils`
4. Return `AuthResponse` with token + user info

> Both "user not found" and "wrong password" return the same error message intentionally — to prevent attackers from discovering which emails are registered.

---

### `config/SecurityConfig.java`
Configures Spring Security for the whole application:

- **`UserDetailsService` bean** → tells Spring how to load a user from the DB by email
- **`PasswordEncoder` bean** → returns `BCryptPasswordEncoder`, used throughout the app
- **`AuthenticationManager` bean** → Spring's internal auth orchestrator
- **`SecurityFilterChain` bean** → the main security rules:
  - CSRF disabled (not needed with JWT)
  - `/api/auth/**` → public (no token required)
  - Everything else → requires a valid JWT token
  - Sessions → `STATELESS` (no server-side sessions, JWT only)
  - Registers `JwtAuthFilter` to run before Spring's default auth filter

---

## Authentication Flow

```
REGISTER:
Frontend → POST /api/auth/register {username, email, password}
         → AuthController → AuthService.register()
         → Validate uniqueness → Hash password → Save User → Return "success"

LOGIN:
Frontend → POST /api/auth/login {email, password}
         → AuthController → AuthService.login()
         → Find user → Verify password → Generate JWT → Return AuthResponse

PROTECTED REQUEST:
Frontend → GET /api/posts (with header: Authorization: Bearer <token>)
         → JwtAuthFilter validates token
         → If valid → sets user in SecurityContext → request reaches controller
         → If invalid → 401 Unauthorized
```

---

## Environment Variables

Stored in `.env` at the project root (gitignored — never committed):

| Variable      | Description                          |
|---------------|--------------------------------------|
| `DB_USERNAME` | PostgreSQL user                      |
| `DB_PASSWORD` | PostgreSQL password                  |
| `JWT_SECRET`  | Secret key for signing JWT tokens    |

---

## Still To Build

### Backend
- Forum/Category entity, repository, service, controller
- Post entity, repository, service, controller
- Comment entity, repository, service, controller
- Role-based access (admin-only endpoints)

### Frontend
- Forum listing page (home)
- Forum detail page (posts inside a forum)
- Post detail page (post + comments)
- Create post form
- Navbar with search
- User profile page
