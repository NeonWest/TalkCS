package com.talkcs.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;
    private String password;
    private String role;
    private LocalDateTime createdAt;
    @Builder.Default
    @Column(columnDefinition = "integer default 0")
    private int reputation = 0;

    @Builder.Default
    @Column(columnDefinition = "boolean default true")
    private boolean emailNotificationsEnabled = true;
}