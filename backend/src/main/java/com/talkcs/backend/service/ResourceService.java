package com.talkcs.backend.service;

import com.talkcs.backend.dto.ResourceResponse;
import com.talkcs.backend.model.Category;
import com.talkcs.backend.model.Resource;
import com.talkcs.backend.model.User;
import com.talkcs.backend.model.Vote;
import com.talkcs.backend.repository.CategoryRepository;
import com.talkcs.backend.repository.ResourceRepository;
import com.talkcs.backend.repository.UserRepository;
import com.talkcs.backend.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResourceService {
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final VoteRepository voteRepository;

    private static final String UPLOAD_DIR = "backend/uploads/";

    private int getVoteScore(Long resourceId) {
        return voteRepository.countByResourceIdAndValue(resourceId, 1) -
            voteRepository.countByResourceIdAndValue(resourceId, -1);
    }

    private int getUserVote(Long resourceId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName().equals("anonymousUser")) {
            return 0;
        }

        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);
        if (currentUser == null) {
            return 0;
        }

        return voteRepository.findByVoterIdAndResourceId(currentUser.getId(), resourceId)
            .map(Vote::getValue)
            .orElse(0);
    }

    private ResourceResponse toResponse(Resource resource) {
        return ResourceResponse.builder()
            .id(resource.getId())
            .title(resource.getTitle())
            .description(resource.getDescription())
            .fileName(resource.getFileName())
            .fileType(resource.getFileType())
            .fileSize(resource.getFileSize())
            .createdAt(resource.getCreatedAt())
            .uploaderUsername(resource.getUploader().getUsername())
            .voteScore(getVoteScore(resource.getId()))
            .userVote(getUserVote(resource.getId()))
            .build();
    }

    public List<ResourceResponse> getResourcesByCategory(Long categoryId) {
        return resourceRepository.findByCategoryId(categoryId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public ResourceResponse uploadResource(MultipartFile file, String title, String description, Long categoryId) throws IOException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User uploader = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Category category = categoryRepository.findById(categoryId).orElseThrow(() -> new RuntimeException("Category not found"));

        Files.createDirectories(Paths.get(UPLOAD_DIR));
        String uniqueFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR + uniqueFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        Resource saved = resourceRepository.save(Resource.builder()
            .title(title)
            .description(description)
            .fileName(file.getOriginalFilename())
            .fileType(file.getContentType())
            .fileSize(file.getSize())
            .filePath(filePath.toString())
            .createdAt(LocalDateTime.now())
            .uploader(uploader)
            .category(category)
            .build());

        return toResponse(saved);
    }

    public Resource getResourceFile(Long id) {
        return resourceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Resource not found"));
    }

    public void deleteResource(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        Resource resource = resourceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Resource not found"));

        boolean isAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!resource.getUploader().getEmail().equals(email) && !isAdmin) {
            throw new RuntimeException("Unauthorized");
        }

        try {
            Files.deleteIfExists(Paths.get(resource.getFilePath()));
        } catch (IOException ignored) {
        }

        resourceRepository.delete(resource);
    }
}
