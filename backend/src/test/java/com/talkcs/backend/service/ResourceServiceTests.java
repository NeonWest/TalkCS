package com.talkcs.backend.service;

import com.talkcs.backend.model.Resource;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.*;
import com.talkcs.backend.testsupport.SecurityTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTests {

    @Mock private ResourceRepository resourceRepository;
    @Mock private UserRepository userRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private VoteRepository voteRepository;
    @InjectMocks private ResourceService resourceService;

    @AfterEach
    void tearDown() { SecurityTestSupport.clear(); }

    @Test
    void deleteResource_blocksOtherStudent() {
        SecurityTestSupport.setAuth("other@t.com", "STUDENT");
        User uploader = User.builder().id(1L).email("up@t.com").build();
        Resource r = Resource.builder().id(1L).uploader(uploader).filePath("uploads/x.pdf").build();
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> resourceService.deleteResource(1L)).hasMessage("Unauthorized");
    }

    @Test
    void deleteResource_allowsOwner() {
        SecurityTestSupport.setAuth("up@t.com", "STUDENT");
        User uploader = User.builder().id(1L).email("up@t.com").build();
        Resource r = Resource.builder().id(1L).uploader(uploader).filePath("uploads/missing.pdf").build();
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(r));

        resourceService.deleteResource(1L);
        verify(resourceRepository).delete(r);
    }

    @Test
    void deleteResource_allowsAdmin() {
        SecurityTestSupport.setAuth("admin@t.com", "ADMIN");
        Resource r = Resource.builder().id(1L)
            .uploader(User.builder().id(2L).email("up@t.com").build())
            .filePath("uploads/missing.pdf").build();
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(r));

        resourceService.deleteResource(1L);
        verify(resourceRepository).delete(r);
    }

    @Test
    void getResourceFile_throwsWhenMissing() {
        when(resourceRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> resourceService.getResourceFile(99L)).hasMessage("Resource not found");
    }
}
