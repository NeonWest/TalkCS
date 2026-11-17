package com.talkcs.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CommentRequest{
    @NotBlank
    @Size(max = 10000)
    private String body;
    @NotNull
    private Long postId;

    private Long parentId;
}