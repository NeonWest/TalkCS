package com.talkcs.backend.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SimilarPostResponse {
    private Long id;
    private String title;
    private double score;
}
