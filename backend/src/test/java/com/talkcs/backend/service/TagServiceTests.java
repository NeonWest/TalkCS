package com.talkcs.backend.service;

import com.talkcs.backend.model.Tag;
import com.talkcs.backend.repository.TagRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagServiceTests {

    @Mock private TagRepository tagRepository;
    @InjectMocks private TagService tagService;

    @Test
    void getOrCreateTag_returnsExistingWhenFound() {
        Tag existing = Tag.builder().id(5L).name("java").build();
        when(tagRepository.findByName("java")).thenReturn(Optional.of(existing));

        Tag out = tagService.getOrCreateTag("  Java  ");
        assertThat(out.getId()).isEqualTo(5L);
        verify(tagRepository, never()).save(any());
    }

    @Test
    void getOrCreateTag_createsWhenMissingAndNormalizes() {
        when(tagRepository.findByName("python")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenAnswer(inv -> inv.getArgument(0));

        Tag out = tagService.getOrCreateTag("Python");
        assertThat(out.getName()).isEqualTo("python");
        ArgumentCaptor<Tag> cap = ArgumentCaptor.forClass(Tag.class);
        verify(tagRepository).save(cap.capture());
        assertThat(cap.getValue().getName()).isEqualTo("python");
    }
}
