package com.talkcs.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SearchResponse {
    private List<PostResponse> posts;
    private List<CategoryResponse> categories;
    private List<UserResponse> users;
}
