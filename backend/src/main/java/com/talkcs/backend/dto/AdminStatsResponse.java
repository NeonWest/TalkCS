package com.talkcs.backend.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminStatsResponse {
    private long totalUsers;
    private long totalPosts;
    private long totalComments;
    private long totalResources;
    private long postsThisWeek;
    private long newUsersThisWeek;
    private List<CategoryStat> mostActiveCategories;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CategoryStat {
        private Long categoryId;
        private String categoryName;
        private long postCount;
    }
}
