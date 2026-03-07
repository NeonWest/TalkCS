package com.talkcs.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class PostRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String body;
    @NotNull
    private Long categoryId;

}