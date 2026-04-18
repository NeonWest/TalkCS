package com.talkcs.backend.service;

import com.talkcs.backend.dto.CategoryRequest;
import com.talkcs.backend.dto.CategoryResponse;
import com.talkcs.backend.repository.CategoryRepository;
import com.talkcs.backend.model.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService{
    private final CategoryRepository categoryrepository;

    public List<CategoryResponse> getAllCategories(){
        return categoryrepository.findByArchivedFalse()
        .stream()
        .map(this::toResponse).toList();
    }

    public List<CategoryResponse> getAllCategoriesAdmin(){
        return categoryrepository.findAll()
        .stream()
        .map(this::toResponse).toList();
    }

    public CategoryResponse createCategory(CategoryRequest request){
        if(categoryrepository.existsByName(request.getName())){
            throw new RuntimeException("Category already exists");
        }
        Category saved = categoryrepository.save(
            Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .createdAt(LocalDateTime.now())
                .build()
        );
        return toResponse(saved);
    }

    public CategoryResponse getCategoryById(Long id){
        Category category = categoryrepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Category not found"));
        return toResponse(category);
    }

    public CategoryResponse updateCategory(Long id, CategoryRequest request){
        Category category = categoryrepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found"));
        if(!category.getName().equals(request.getName()) && categoryrepository.existsByName(request.getName())){
            throw new RuntimeException("Category name already exists");
        }
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        return toResponse(categoryrepository.save(category));
    }

    public void softDeleteCategory(Long id){
        Category category = categoryrepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found"));
        category.setArchived(true);
        categoryrepository.save(category);
    }

    public void restoreCategory(Long id){
        Category category = categoryrepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found"));
        category.setArchived(false);
        categoryrepository.save(category);
    }

    private CategoryResponse toResponse(Category c){
        return CategoryResponse.builder()
            .id(c.getId())
            .name(c.getName())
            .description(c.getDescription())
            .createdAt(c.getCreatedAt())
            .archived(c.isArchived())
            .build();
    }
}
