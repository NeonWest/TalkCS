package com.talkcs.backend.service;

import com.talkcs.backend.dto.*;
import com.talkcs.backend.repository.*;
import com.talkcs.backend.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.*;
import java.time.LocalDateTime;
import java.util.List;
@Service
@RequiredArgsConstructor
public class PostService{
    private final PostRepository postrepository;
    private final CommentRepository commentrepository;
    private final UserRepository userrepository;
    private final CategoryRepository categoryrepository;
    public List<PostResponse> getAllPostsByCategoryId(Long Id){
        return postrepository.findByCategoryId(Id)
        .stream()
        .map(post -> PostResponse.builder()
        .id(post.getId())
        .title(post.getTitle())
        .body(post.getBody())
        .authorUsername(post.getAuthor().getUsername())
        .createdAt(post.getCreatedAt())
        .commentCount(commentrepository.countByPostId(post.getId()))
        .build()).toList();
    }
    public PostResponse createPost(PostRequest request){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userrepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User Not Found"));
        Category category = categoryrepository.findById(request.getCategoryId()).orElseThrow(() -> new RuntimeException("Category Not Found"));


        Post saved = postrepository.save(
            Post.builder()
            .title(request.getTitle())
            .body(request.getBody())
            .author(user)
            .category(category)
            .createdAt(LocalDateTime.now())
            .build()
        );
        return PostResponse.builder()
        .id(saved.getId())
        .title(saved.getTitle())
        .body(saved.getBody())
        .authorUsername(saved.getAuthor().getUsername())
        .commentCount(0)
        .createdAt(saved.getCreatedAt())
        .build();

    }
}