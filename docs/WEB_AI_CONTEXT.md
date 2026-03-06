# TalkCS — Full Project Context for Web AI Chats

This document contains everything needed to understand the TalkCS project and help with it, without access to the codebase. You can paste this into any AI chat.

---

## What is TalkCS?
A university forum platform (thesis project). Users can register, log in, and browse forum categories. Admins can create categories. Posts and comments are next to be built.

## Tech Stack
- **Backend:** Java 21, Spring Boot 4, Spring Security 6, PostgreSQL 16, Hibernate/JPA, Lombok, jjwt 0.12.6
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4, Axios, react-router-dom, react-hook-form
- **Auth:** JWT (stateless), BCrypt password hashing
- **Ports:** Backend on 8080, Frontend on 5173

---

## Project folder structure

```
TalkCS/
├── .env                         ← DB_USERNAME, DB_PASSWORD, JWT_SECRET (not in git)
├── backend/
│   ├── start.sh                 ← sources .env and runs gradlew bootRun
│   └── src/main/java/com/talkcs/backend/
│       ├── BackendApplication.java
│       ├── config/
│       │   └── SecurityConfig.java
│       ├── controller/
│       │   ├── AuthController.java
│       │   └── CategoryController.java
│       ├── dto/
│       │   ├── AuthResponse.java
│       │   ├── LoginRequest.java
│       │   ├── RegisterRequest.java
│       │   ├── CategoryRequest.java
│       │   └── CategoryResponse.java
│       ├── model/
│       │   ├── User.java
│       │   └── Category.java
│       ├── repository/
│       │   ├── UserRepository.java
│       │   └── CategoryRepository.java
│       ├── security/
│       │   ├── JwtUtils.java
│       │   ├── JwtAuthFilter.java
│       │   └── UserLoader.java
│       └── service/
│           ├── AuthService.java
│           └── CategoryService.java
└── frontend/src/
    ├── api/
    │   ├── api.ts               ← Axios instance + JWT interceptor
    │   ├── auth.ts              ← register(), login()
    │   └── categories.ts        ← getCategories(), createCategory(), getCategoryById()
    ├── context/
    │   └── AuthContext.tsx      ← user + token state, localStorage persistence
    ├── components/
    │   └── ProtectedRoute.tsx
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   └── HomePage.tsx         ← shows category list + admin create modal
    └── App.tsx                  ← routes
```

---

## Backend — Full Code

### `application.properties`
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/talkcs
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
app.jwt.secret=${JWT_SECRET}
app.jwt.expiration-ms=86400000
```

### `model/User.java`
```java
package com.talkcs.backend.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    private String email;
    private String password;
    private String role;       // "STUDENT" or "ADMIN"
    private LocalDateTime createdAt;
}
```

### `model/Category.java`
```java
package com.talkcs.backend.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "categories")
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String name;
    private String description;
    private LocalDateTime createdAt;
}
```

### `dto/RegisterRequest.java`
```java
package com.talkcs.backend.dto;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank private String username;
    @NotBlank @Email private String email;
    @NotBlank @Size(min = 8) private String password;
}
```

### `dto/LoginRequest.java`
```java
package com.talkcs.backend.dto;
import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}
```

### `dto/AuthResponse.java`
```java
package com.talkcs.backend.dto;
import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private String email;
    private String role;
}
```

### `dto/CategoryRequest.java`
```java
package com.talkcs.backend.dto;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank private String name;
    @NotBlank private String description;
}
```

### `dto/CategoryResponse.java`
```java
package com.talkcs.backend.dto;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
}
```

### `repository/UserRepository.java`
```java
package com.talkcs.backend.repository;
import com.talkcs.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
```

### `repository/CategoryRepository.java`
```java
package com.talkcs.backend.repository;
import com.talkcs.backend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByName(String name);
}
```

### `security/JwtUtils.java`
```java
package com.talkcs.backend.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtils {
    @Value("${app.jwt.secret}") private String jwtSecret;
    @Value("${app.jwt.expiration-ms}") private long jwtExpirationMs;

    public String generateToken(String subject) {
        return Jwts.builder()
            .subject(subject)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(getSigningKey())
            .compact();
    }

    public String getUserNameFromToken(String token) {
        return Jwts.parser().verifyWith(getSigningKey()).build()
            .parseSignedClaims(token).getPayload().getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) { return false; }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }
}
```

### `security/UserLoader.java`
```java
package com.talkcs.backend.security;
import com.talkcs.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class UserLoader implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
            .map(user -> User.withUsername(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole())   // IMPORTANT: .roles() prefixes with ROLE_ automatically
                .build())
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
```

### `security/JwtAuthFilter.java`
```java
package com.talkcs.backend.security;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component @RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); return;
        }
        String token = authHeader.substring(7);
        if (!jwtUtils.validateToken(token)) {
            filterChain.doFilter(request, response); return;
        }
        String email = jwtUtils.getUserNameFromToken(token); // token subject IS the email
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(auth);
        filterChain.doFilter(request, response);
    }
}
```

### `config/SecurityConfig.java`
```java
package com.talkcs.backend.config;
import com.talkcs.backend.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;
import java.util.List;

@Configuration @EnableWebSecurity @EnableMethodSecurity @RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthFilter jwtAuthFilter;

    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5174"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

### `service/AuthService.java`
```java
package com.talkcs.backend.service;
import com.talkcs.backend.dto.*;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.UserRepository;
import com.talkcs.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service @RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new RuntimeException("Email already exists");
        if (userRepository.existsByUsername(request.getUsername()))
            throw new RuntimeException("Username already exists");
        userRepository.save(User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .role("STUDENT")
            .createdAt(LocalDateTime.now())
            .build());
        return "User registered successfully";
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword()))
            throw new RuntimeException("Invalid credentials");
        // IMPORTANT: token subject is the EMAIL (not username) — UserLoader.loadUserByUsername expects email
        String token = jwtUtils.generateToken(user.getEmail());
        return AuthResponse.builder()
            .token(token).username(user.getUsername())
            .email(user.getEmail()).role(user.getRole()).build();
    }
}
```

### `service/CategoryService.java`
```java
package com.talkcs.backend.service;
import com.talkcs.backend.dto.*;
import com.talkcs.backend.model.Category;
import com.talkcs.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service @RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryrepository;

    public List<CategoryResponse> getAllCategories() {
        return categoryrepository.findAll().stream()
            .map(c -> CategoryResponse.builder()
                .id(c.getId()).name(c.getName())
                .description(c.getDescription()).createdAt(c.getCreatedAt()).build())
            .toList();
    }

    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryrepository.existsByName(request.getName()))
            throw new RuntimeException("Category already exists");
        Category saved = categoryrepository.save(Category.builder()
            .name(request.getName()).description(request.getDescription())
            .createdAt(LocalDateTime.now()).build());
        return CategoryResponse.builder()
            .id(saved.getId()).name(saved.getName())
            .description(saved.getDescription()).createdAt(saved.getCreatedAt()).build();
    }

    public CategoryResponse getCategoryById(Long id) {
        Category c = categoryrepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found"));
        return CategoryResponse.builder()
            .id(c.getId()).name(c.getName())
            .description(c.getDescription()).createdAt(c.getCreatedAt()).build();
    }
}
```

### `controller/AuthController.java`
```java
package com.talkcs.backend.controller;
import com.talkcs.backend.dto.*;
import com.talkcs.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
```

### `controller/CategoryController.java`
```java
package com.talkcs.backend.controller;
import com.talkcs.backend.dto.*;
import com.talkcs.backend.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/categories") @RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryservice;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryservice.getAllCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryservice.getCategoryById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")  // IMPORTANT: hasRole not hasAuthority — UserLoader uses .roles()
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryservice.createCategory(request));
    }
}
```

---

## Frontend — Full Code

### `src/api/api.ts`
```typescript
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8080' });

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
```

### `src/api/auth.ts`
```typescript
import api from './api';

export interface RegisterRequest { username: string; email: string; password: string; }
export interface LoginRequest { email: string; password: string; }
export interface AuthResponse { token: string; username: string; email: string; role: string; }

export const register = async (data: RegisterRequest): Promise<string> => {
    const response = await api.post<string>('/api/auth/register', data);
    return response.data;
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
};
```

### `src/api/categories.ts`
```typescript
import api from './api';

export interface Category { id: number; name: string; description: string; createdAt: string; }
export interface CategoryRequest { name: string; description: string; }

export const getCategories = async (): Promise<Category[]> => {
    return (await api.get<Category[]>('/api/categories')).data;
};

export const createCategory = async (data: CategoryRequest): Promise<Category> => {
    return (await api.post<Category>('/api/categories', data)).data;
};

export const getCategoryById = async (id: number): Promise<Category> => {
    return (await api.get<Category>(`/api/categories/${id}`)).data;
};
```

### `src/context/AuthContext.tsx`
```tsx
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthResponse } from '../api/auth';

interface AuthContextType {
    user: AuthResponse | null;
    token: string | null;
    login: (data: AuthResponse) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthResponse | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

    const login = (data: AuthResponse) => {
        setUser(data); setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
    };

    const logout = () => {
        setUser(null); setToken(null);
        localStorage.removeItem('token'); localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
```

### `src/App.tsx`
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
```

---

## Key design decisions & pitfalls

1. **JWT token subject = email** — `AuthService.login()` calls `jwtUtils.generateToken(user.getEmail())`. The token subject is the user's email. `UserLoader.loadUserByUsername(email)` then does `findByEmail(email)`. If you use `user.getUsername()` in the token, auth breaks on all protected routes.

2. **`hasRole` vs `hasAuthority`** — `UserLoader` uses `.roles(user.getRole())` which Spring Security prefixes with `ROLE_`. So `@PreAuthorize` must use `hasRole('ADMIN')` (not `hasAuthority('ADMIN')`). `hasAuthority('ADMIN')` would fail even for ADMIN users.

3. **`@EnableMethodSecurity`** is required on `SecurityConfig` for `@PreAuthorize` to have any effect. Without it, the annotation is silently ignored.

4. **All users register as STUDENT** — to make someone ADMIN, run SQL: `UPDATE users SET role = 'ADMIN' WHERE email = 'x@y.com';`

5. **CORS** is configured in `SecurityConfig` for `localhost:5173` and `5174` only.

---

## API summary

| Method | Endpoint | Auth required | Role |
|---|---|---|---|
| POST | `/api/auth/register` | No | — |
| POST | `/api/auth/login` | No | — |
| GET | `/api/categories` | Yes | Any |
| GET | `/api/categories/{id}` | Yes | Any |
| POST | `/api/categories` | Yes | ADMIN only |
