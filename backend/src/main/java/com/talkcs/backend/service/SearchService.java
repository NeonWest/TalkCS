package com.talkcs.backend.service;

import com.talkcs.backend.dto.CategoryResponse;
import com.talkcs.backend.dto.PostResponse;
import com.talkcs.backend.dto.SearchResponse;
import com.talkcs.backend.dto.UserResponse;
import com.talkcs.backend.repository.CategoryRepository;
import com.talkcs.backend.repository.CommentRepository;
import com.talkcs.backend.repository.PostRepository;
import com.talkcs.backend.repository.UserRepository;
import com.talkcs.backend.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {
    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final VoteRepository voteRepository;

    public SearchResponse search(String keyword) {
        List<PostResponse> posts = postRepository
            .findByTitleContainingIgnoreCaseOrBodyContainingIgnoreCase(keyword, keyword)
            .stream()
            .map(post -> PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .body(post.getBody())
                .authorUsername(post.getAuthor().getUsername())
                .createdAt(post.getCreatedAt())
                .commentCount(commentRepository.countByPostId(post.getId()))
                .voteScore(voteRepository.countByPostIdAndValue(post.getId(), 1) -
                    voteRepository.countByPostIdAndValue(post.getId(), -1))
                .userVote(0)
                .build())
            .toList();

        List<CategoryResponse> categories = categoryRepository
            .findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(keyword, keyword)
            .stream()
            .map(c -> CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .createdAt(c.getCreatedAt())
                .build())
            .toList();

        List<UserResponse> users = userRepository
            .findByUsernameContainingIgnoreCase(keyword)
            .stream()
            .map(u -> UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .createdAt(u.getCreatedAt())
                .role(u.getRole())
                .postCount(postRepository.countByAuthorId(u.getId()))
                .commentCount(commentRepository.countByAuthorId(u.getId()))
                .reputation(u.getReputation())
                .build())
            .toList();

        return SearchResponse.builder()
            .posts(posts)
            .categories(categories)
            .users(users)
            .build();
    }
}
