package com.talkcs.backend.controller;

import com.talkcs.backend.dto.AdminStatsResponse;
import com.talkcs.backend.dto.UserAdminResponse;
import com.talkcs.backend.model.SiteConfig;
import com.talkcs.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getUsers(page, search));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserAdminResponse> setRole(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(adminService.setRole(id, body.get("role")));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/config")
    public ResponseEntity<SiteConfig> getConfig() {
        return ResponseEntity.ok(adminService.getConfig());
    }

    @PutMapping("/config")
    public ResponseEntity<SiteConfig> updateConfig(@RequestBody SiteConfig request) {
        return ResponseEntity.ok(adminService.updateConfig(request));
    }
}
