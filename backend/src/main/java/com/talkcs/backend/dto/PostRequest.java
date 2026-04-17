package com.talkcs.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class PostRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String body;
    @NotNull
    private Long categoryId;
    private List<String> tags = new ArrayList<>();
}