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
public class CommentService{
    private final PostRepository postrepository;
    private final CommentRepository commentrepository;
    private final UserRepository userrepository;

    public List<CommentResponse> getCommentsByPostId(Long Id){
        return commentrepository.findByPostIdAndParentIsNull(Id)
        .stream()
        .map(comment -> CommentResponse.builder()
        .id(comment.getId())
        .body(comment.getBody())
        .createdAt(comment.getCreatedAt())
        .authorUsername(comment.getAuthor().getUsername())
        .children(getChildren(comment.getId()))
        .build()).toList();
    }

    private List<CommentResponse> getChildren(Long Id){
        return commentrepository.findByParentId(Id)
        .stream()
        .map(children -> CommentResponse.builder()
        .id(children.getId())
        .body(children.getBody())
        .createdAt(children.getCreatedAt())
        .authorUsername(children.getAuthor().getUsername())
        .children(getChildren(children.getId()))
        .build()).toList();
    }
    
    public CommentResponse createComment(CommentRequest request){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userrepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User Not Found"));
        Post post = postrepository.findById(request.getPostId()).orElseThrow(() -> new RuntimeException("Post Not Found"));
        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentrepository.findById(request.getParentId())
            .orElseThrow(() -> new RuntimeException("Parent Not Found"));
}

        Comment saved = commentrepository.save(
            Comment.builder()
            .body(request.getBody())
            .createdAt(LocalDateTime.now())
            .author(user)
            .post(post)
            .parent(parent)
            .build()
        );

        return CommentResponse.builder()
        .id(saved.getId())
        .body(saved.getBody())
        .authorUsername(saved.getAuthor().getUsername())
        .createdAt(saved.getCreatedAt())
        .children(getChildren(saved.getId()))
        .build();

    }
}