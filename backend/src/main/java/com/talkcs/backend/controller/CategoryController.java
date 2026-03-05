package com.talkcs.backend.controller;

import com.talkcs.backend.dto.CategoryRequest;
import com.talkcs.backend.dto.CategoryResponse;
import com.talkcs.backend.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController{
    private final CategoryService categoryservice;
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories(){
        return ResponseEntity.ok(categoryservice.getAllCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable Long id){
        return ResponseEntity.ok(categoryservice.getCategoryById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<CategoryResponse> 
    createCategory(@Valid @RequestBody CategoryRequest request){
        return ResponseEntity.ok(categoryservice.createCategory(request));
    }
}