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
    private final BadgeService badgeService;
    private final CategoryReputationRepository categoryReputationRepository;
    private final BookmarkRepository bookmarkRepository;
    private final MentionService mentionService;
    private final NotificationService notificationService;

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
        mentionService.extractMentions(request.getBody()).forEach(mentioned -> {
            if (!mentioned.getId().equals(user.getId())) {
                notificationService.notify(mentioned,
                    Notification.NotificationType.MENTION,
                    user.getUsername() + " mentioned you in a post: " + request.getTitle(),
                    "/post/" + saved.getId());
            }
        });
        badgeService.checkAndAwardBadges(user);
        return toResponse(saved);

    }
    public PostResponse getPostById(Long id) {
        Post post = postrepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        return toResponse(post);
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
    return toResponse(saved);
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

    public PostResponse setStatus(Long id, String status) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        Post post = postrepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!post.getAuthor().getEmail().equals(email) && !isAdmin)
            throw new RuntimeException("Unauthorized");
        post.setStatus(PostStatus.valueOf(status.toUpperCase()));
        return toResponse(postrepository.save(post));
    }

    public PostResponse acceptAnswer(Long postId, Long commentId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Post post = postrepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getAuthor().getEmail().equals(email))
            throw new RuntimeException("Only post author can accept answers");
        Comment comment = commentrepository.findById(commentId).orElseThrow(() -> new RuntimeException("Comment not found"));

        post.setAcceptedAnswer(comment);
        post.setStatus(PostStatus.SOLVED);
        postrepository.save(post);

        // +15 rep to commenter, +2 rep to post author
        User commenter = comment.getAuthor();
        commenter.setReputation(commenter.getReputation() + 15);
        userrepository.save(commenter);

        User poster = post.getAuthor();
        poster.setReputation(poster.getReputation() + 2);
        userrepository.save(poster);

        // +15 category rep to commenter for accepted answer
        CategoryReputation cr = categoryReputationRepository
            .findByUserIdAndCategoryId(commenter.getId(), post.getCategory().getId())
            .orElseGet(() -> CategoryReputation.builder().user(commenter).category(post.getCategory()).build());
        cr.setReputation(cr.getReputation() + 15);
        categoryReputationRepository.save(cr);

        notificationService.notify(commenter,
            Notification.NotificationType.ACCEPTED_ANSWER,
            poster.getUsername() + " accepted your answer on: " + post.getTitle(),
            "/post/" + post.getId());

        badgeService.awardAnswerAcceptedBadge(commenter);
        badgeService.checkAndAwardBadges(commenter);
        badgeService.checkAndAwardBadges(poster);
        badgeService.checkExpertiseBadges(commenter, post.getCategory());

        return toResponse(post);
    }

    public PostResponse unacceptAnswer(Long postId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Post post = postrepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getAuthor().getEmail().equals(email))
            throw new RuntimeException("Only post author can unaccept answers");
        if (post.getAcceptedAnswer() == null)
            return toResponse(post);

        User commenter = post.getAcceptedAnswer().getAuthor();
        commenter.setReputation(Math.max(0, commenter.getReputation() - 15));
        userrepository.save(commenter);

        User poster = post.getAuthor();
        poster.setReputation(Math.max(0, poster.getReputation() - 2));
        userrepository.save(poster);

        post.setAcceptedAnswer(null);
        post.setStatus(PostStatus.OPEN);
        postrepository.save(post);

        return toResponse(post);
    }

    private PostResponse toResponse(Post post) {
        return PostResponse.builder()
            .id(post.getId())
            .categoryId(post.getCategory().getId())
            .title(post.getTitle())
            .body(post.getBody())
            .authorUsername(post.getAuthor().getUsername())
            .createdAt(post.getCreatedAt())
            .commentCount(commentrepository.countByPostId(post.getId()))
            .voteScore(getVoteScore(post.getId()))
            .userVote(getUserVote(post.getId()))
            .tags(post.getTags().stream().map(Tag::getName).collect(Collectors.toList()))
            .status(post.getStatus() != null ? post.getStatus() : PostStatus.OPEN)
            .acceptedAnswerId(post.getAcceptedAnswer() != null ? post.getAcceptedAnswer().getId() : null)
            .authorLevel(UserService.getLevelTitle(post.getAuthor().getReputation()))
            .bookmarkedByCurrentUser(isBookmarked(post.getId()))
            .build();
    }

    public List<PostResponse> getTrendingPosts(int limit) {
        java.time.LocalDateTime since = java.time.LocalDateTime.now().minusDays(7);
        return postrepository.findTrendingPosts(since, PageRequest.of(0, limit))
            .stream().map(this::toResponse).toList();
    }

    private boolean isBookmarked(Long postId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName().equals("anonymousUser")) return false;
        User currentUser = userrepository.findByEmail(auth.getName()).orElse(null);
        if (currentUser == null) return false;
        return bookmarkRepository.existsByUserIdAndPostId(currentUser.getId(), postId);
    }

    public void bookmarkPost(Long postId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userrepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postrepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        if (!bookmarkRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            bookmarkRepository.save(Bookmark.builder().user(user).post(post).createdAt(java.time.LocalDateTime.now()).build());
        }
    }

    public void unbookmarkPost(Long postId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userrepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        bookmarkRepository.findByUserIdAndPostId(user.getId(), postId).ifPresent(bookmarkRepository::delete);
    }

    public List<PostResponse> getUserBookmarks(String username) {
        User user = userrepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
        return bookmarkRepository.findByUserId(user.getId()).stream()
            .map(b -> toResponse(b.getPost()))
            .toList();
    }

    private Set<Tag> resolveTags(List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) return new HashSet<>();
        return tagNames.stream()
            .filter(n -> n != null && !n.isBlank())
            .map(tagService::getOrCreateTag)
            .collect(Collectors.toSet());
    }
}