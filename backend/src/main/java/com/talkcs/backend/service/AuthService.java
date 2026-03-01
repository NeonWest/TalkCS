package com.talkcs.backend.service;

import com.talkcs.backend.dto.AuthResponse;
import com.talkcs.backend.dto.LoginRequest;
import com.talkcs.backend.dto.RegisterRequest;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.UserRepository;
import com.talkcs.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public String register(RegisterRequest request){
        if(userRepository.existsByEmail(request.getEmail())){
            throw new RuntimeException("Email already exists");
        }
        if(userRepository.existsByUsername(request.getUsername())){
            throw new RuntimeException("Username already exists");
        }
        User user = User.builder().username(request.getUsername())
        .email(request.getEmail())
        .password(passwordEncoder.encode(request.getPassword()))
        .role("STUDENT")
        .createdAt(LocalDateTime.now())
        .build();
        userRepository.save(user);
        return "User registered successfully";
    }
    public AuthResponse login(LoginRequest request){
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        
        String token = jwtUtils.generateToken(user.getUsername());
        return AuthResponse.builder()
            .token(token)
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole())
            .build();
    }
}