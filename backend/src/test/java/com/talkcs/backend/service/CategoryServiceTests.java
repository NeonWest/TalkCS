package com.talkcs.backend.service;

import com.talkcs.backend.dto.CategoryRequest;
import com.talkcs.backend.dto.CategoryResponse;
import com.talkcs.backend.model.Category;
import com.talkcs.backend.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTests {

    @Mock private CategoryRepository categoryRepository;
    @InjectMocks private CategoryService categoryService;

    @Test
    void getAllCategories_excludesArchived() {
        Category a = Category.builder().id(1L).name("A").description("d1").build();
        when(categoryRepository.findByArchivedFalse()).thenReturn(List.of(a));

        List<CategoryResponse> out = categoryService.getAllCategories();
        assertThat(out).hasSize(1);
        assertThat(out.get(0).getName()).isEqualTo("A");
    }

    @Test
    void getAllCategoriesAdmin_returnsAll() {
        when(categoryRepository.findAll()).thenReturn(List.of(
            Category.builder().id(1L).name("A").build(),
            Category.builder().id(2L).name("B").archived(true).build()
        ));

        assertThat(categoryService.getAllCategoriesAdmin()).hasSize(2);
    }

    @Test
    void createCategory_persistsNewWhenUnique() {
        CategoryRequest req = new CategoryRequest();
        req.setName("Tech"); req.setDescription("Discuss tech");
        when(categoryRepository.existsByName("Tech")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
            Category c = inv.getArgument(0);
            c.setId(42L);
            return c;
        });

        CategoryResponse res = categoryService.createCategory(req);

        assertThat(res.getId()).isEqualTo(42L);
        assertThat(res.getName()).isEqualTo("Tech");
        ArgumentCaptor<Category> cap = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).save(cap.capture());
        assertThat(cap.getValue().getCreatedAt()).isNotNull();
    }

    @Test
    void createCategory_throwsWhenDuplicateName() {
        CategoryRequest req = new CategoryRequest();
        req.setName("Tech");
        when(categoryRepository.existsByName("Tech")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(req))
            .hasMessage("Category already exists");
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void getCategoryById_throwsWhenMissing() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> categoryService.getCategoryById(99L))
            .hasMessage("Category not found");
    }

    @Test
    void updateCategory_updatesFields() {
        Category existing = Category.builder().id(1L).name("Old").description("d").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CategoryRequest req = new CategoryRequest();
        req.setName("New"); req.setDescription("d2");
        CategoryResponse res = categoryService.updateCategory(1L, req);

        assertThat(res.getName()).isEqualTo("New");
        assertThat(res.getDescription()).isEqualTo("d2");
    }

    @Test
    void updateCategory_blocksDuplicateRename() {
        Category existing = Category.builder().id(1L).name("Old").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.existsByName("Taken")).thenReturn(true);

        CategoryRequest req = new CategoryRequest();
        req.setName("Taken");
        assertThatThrownBy(() -> categoryService.updateCategory(1L, req))
            .hasMessage("Category name already exists");
    }

    @Test
    void softDeleteCategory_setsArchivedTrue() {
        Category c = Category.builder().id(1L).name("X").archived(false).build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(c));

        categoryService.softDeleteCategory(1L);

        assertThat(c.isArchived()).isTrue();
        verify(categoryRepository).save(c);
    }

    @Test
    void restoreCategory_setsArchivedFalse() {
        Category c = Category.builder().id(1L).name("X").archived(true).build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(c));

        categoryService.restoreCategory(1L);

        assertThat(c.isArchived()).isFalse();
        verify(categoryRepository).save(c);
    }
}
