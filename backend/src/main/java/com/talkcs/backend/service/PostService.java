package com.talkcs.backend.service;

import com.talkcs.backend.dto.*;
import com.talkcs.backend.repository.*;
import com.talkcs.backend.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;


@Service
@RequiredArgsConstructor
public class PostService{
    private final PostRepository postrepository;
    private final CommentRepository commentrepository;
    private final UserRepository userrepository;
    private final CategoryRepository categoryrepository;
    private final VoteRepository voteRepository;
    private final TagService tagService;

    public Map<String, Object> getAllPostsByCategoryId(Long categoryId, int page, int size, String sortBy) {
        Sort sort = switch (sortBy) {
            case "votes" -> Sort.by("id").descending();
            case "comments" -> Sort.by("id").descending();
            default -> Sort.by("createdAt").descending();
        };

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Post> postPage = postrepository.findByCategoryId(categoryId, pageable);
        List<PostResponse> posts = postPage.getContent().stream()
            .map(this::toResponse)
            .toList();

        if ("votes".equals(sortBy)) {
            posts = posts.stream()
                .sorted((a, b) -> Integer.compare(b.getVoteScore(), a.getVoteScore()))
                .toList();
        } else if ("comments".equals(sortBy)) {
            posts = posts.stream()
                .sorted((a, b) -> Integer.compare(b.getCommentCount(), a.getCommentCount()))
                .toList();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("posts", posts);
        response.put("currentPage", postPage.getNumber());
        response.put("totalPages", postPage.getTotalPages());
        response.put("totalItems", postPage.getTotalElements());
        response.put("hasNext", postPage.hasNext());
        response.put("hasPrevious", postPage.hasPrevious());
        return response;
    }

    public PostResponse createPost(PostRequest request){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userrepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User Not Found"));
        Category category = categoryrepository.findById(request.getCategoryId()).orElseThrow(() -> new RuntimeException("Category Not Found"));


        Set<Tag> tags = resolveTags(request.getTags());
        Post saved = postrepository.save(
            Post.builder()
            .title(request.getTitle())
            .body(request.getBody())
            .author(user)
            .category(category)
            .createdAt(LocalDateTime.now())
            .tags(tags)
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
        .tags(saved.getTags().stream().map(Tag::getName).collect(Collectors.toList()))
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
            .tags(post.getTags().stream().map(Tag::getName).collect(Collectors.toList()))
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
    post.setTags(resolveTags(request.getTags()));
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
        .tags(saved.getTags().stream().map(Tag::getName).collect(Collectors.toList()))
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

    private PostResponse toResponse(Post post) {
        return PostResponse.builder()
            .id(post.getId())
            .title(post.getTitle())
            .body(post.getBody())
            .authorUsername(post.getAuthor().getUsername())
            .createdAt(post.getCreatedAt())
            .commentCount(commentrepository.countByPostId(post.getId()))
            .voteScore(getVoteScore(post.getId()))
            .userVote(getUserVote(post.getId()))
            .tags(post.getTags().stream().map(Tag::getName).collect(Collectors.toList()))
            .build();
    }

    private Set<Tag> resolveTags(List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) return new HashSet<>();
        return tagNames.stream()
            .filter(n -> n != null && !n.isBlank())
            .map(tagService::getOrCreateTag)
            .collect(Collectors.toSet());
    }
}