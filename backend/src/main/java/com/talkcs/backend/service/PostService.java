package com.talkcs.backend.service;

import com.talkcs.backend.dto.*;
import com.talkcs.backend.repository.*;
import com.talkcs.backend.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.*;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.core.Authentication;


@Service
@RequiredArgsConstructor
public class PostService{
    private final PostRepository postrepository;
    private final CommentRepository commentrepository;
    private final UserRepository userrepository;
    private final CategoryRepository categoryrepository;
    private final VoteRepository voteRepository;
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
        .voteScore(getVoteScore(post.getId()))
    .userVote(getUserVote(post.getId()))
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
        .voteScore(getVoteScore(saved.getId()))
        .userVote(getUserVote(saved.getId()))
        .build();

    }
    public PostResponse getPostById(Long id) {
        Post post = postrepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        return PostResponse.builder()
            .id(post.getId())
            .title(post.getTitle())
            .body(post.getBody())
            .authorUsername(post.getAuthor().getUsername())
            .createdAt(post.getCreatedAt())
            .commentCount(commentrepository.countByPostId(post.getId()))
            .voteScore(getVoteScore(post.getId()))
            .userVote(getUserVote(post.getId()))
            .build();
    }

    public PostResponse editPost(Long id, PostRequest request) {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    Post post = postrepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Post not found"));
    if (!post.getAuthor().getEmail().equals(email))
        throw new RuntimeException("Unauthorized");
    post.setTitle(request.getTitle());
    post.setBody(request.getBody());
    Post saved = postrepository.save(post);
    return PostResponse.builder()
        .id(saved.getId())
        .title(saved.getTitle())
        .body(saved.getBody())
        .authorUsername(saved.getAuthor().getUsername())
        .createdAt(saved.getCreatedAt())
        .commentCount(commentrepository.countByPostId(saved.getId()))
        .voteScore(getVoteScore(saved.getId()))
        .userVote(getUserVote(saved.getId()))
        .build();
    }

    public void deletePost(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        Post post = postrepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        boolean isAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!post.getAuthor().getEmail().equals(email) && !isAdmin)
            throw new RuntimeException("Unauthorized");
        postrepository.delete(post);
    }

    private int getVoteScore(Long postId) {
    return voteRepository.countByPostIdAndValue(postId, 1) -
           voteRepository.countByPostIdAndValue(postId, -1);
    }

    private int getUserVote(Long postId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName().equals("anonymousUser"))
            return 0;
        User currentUser = userrepository.findByEmail(auth.getName()).orElse(null);
        if (currentUser == null) return 0;
        return voteRepository.findByVoterIdAndPostId(currentUser.getId(), postId)
            .map(Vote::getValue).orElse(0);
    }
}