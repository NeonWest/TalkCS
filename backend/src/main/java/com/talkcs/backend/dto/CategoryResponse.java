package com.talkcs.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryResponse{
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
}