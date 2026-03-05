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
        return categoryrepository.findAll()
        .stream()
        .map(category -> CategoryResponse.builder()
        .id(category.getId())
        .name(category.getName())
        .description(category.getDescription())
        .createdAt(category.getCreatedAt())
        .build()).toList();

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

        return CategoryResponse.builder()
            .id(saved.getId())
            .name(saved.getName())
            .description(saved.getDescription())
            .createdAt(saved.getCreatedAt())
            .build();
    }
    public CategoryResponse getCategoryById(Long id){
        Category category = categoryrepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Category not found"));
        return CategoryResponse.builder()
        .id(category.getId())
        .name(category.getName())
        .description(category.getDescription())
        .createdAt(category.getCreatedAt())
        .build();

    }
}