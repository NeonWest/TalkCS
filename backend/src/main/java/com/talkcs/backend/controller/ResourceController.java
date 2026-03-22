package com.talkcs.backend.controller;

import com.talkcs.backend.dto.ResourceResponse;
import com.talkcs.backend.model.Resource;
import com.talkcs.backend.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {
    private final ResourceService resourceService;

    @GetMapping
    public ResponseEntity<List<ResourceResponse>> getResourcesByCategory(@RequestParam Long categoryId) {
        return ResponseEntity.ok(resourceService.getResourcesByCategory(categoryId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceResponse> uploadResource(
        @RequestParam MultipartFile file,
        @RequestParam String title,
        @RequestParam String description,
        @RequestParam Long categoryId
    ) throws IOException {
        return ResponseEntity.ok(resourceService.uploadResource(file, title, description, categoryId));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadResource(@PathVariable Long id) throws IOException {
        Resource resource = resourceService.getResourceFile(id);
        PathResource fileResource = new PathResource(Paths.get(resource.getFilePath()));
        MediaType contentType = resource.getFileType() == null
            ? MediaType.APPLICATION_OCTET_STREAM
            : MediaType.parseMediaType(resource.getFileType());

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFileName() + "\"")
            .contentType(contentType)
            .body(fileResource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}
