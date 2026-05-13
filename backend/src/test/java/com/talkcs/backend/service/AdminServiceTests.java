package com.talkcs.backend.service;

import com.talkcs.backend.dto.AdminStatsResponse;
import com.talkcs.backend.model.SiteConfig;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTests {

    @Mock private UserRepository userRepository;
    @Mock private PostRepository postRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private SiteConfigRepository siteConfigRepository;
    @InjectMocks private AdminService adminService;

    @Test
    void getStats_aggregatesCounts() {
        when(userRepository.count()).thenReturn(100L);
        when(postRepository.count()).thenReturn(50L);
        when(commentRepository.count()).thenReturn(200L);
        when(resourceRepository.count()).thenReturn(10L);
        when(postRepository.countByCreatedAtAfter(any())).thenReturn(7L);
        when(userRepository.countByCreatedAtAfter(any())).thenReturn(3L);
        when(postRepository.countGroupByCategory(any())).thenReturn(List.<Object[]>of(
            new Object[]{1L, "Java", 20L}, new Object[]{2L, "Python", 15L}
        ));

        AdminStatsResponse r = adminService.getStats();
        assertThat(r.getTotalUsers()).isEqualTo(100L);
        assertThat(r.getMostActiveCategories()).hasSize(2);
        assertThat(r.getMostActiveCategories().get(0).getCategoryName()).isEqualTo("Java");
    }

    @Test
    void getUsers_returnsPaged() {
        User u = User.builder().id(1L).username("a").email("a@t.com").role("STUDENT").build();
        Page<User> page = new PageImpl<>(List.of(u));
        when(userRepository.findAll(any(org.springframework.data.domain.Pageable.class))).thenReturn(page);
        when(postRepository.countByAuthorId(any())).thenReturn(0L);
        when(commentRepository.countByAuthorId(any())).thenReturn(0L);

        Map<String, Object> result = adminService.getUsers(0, null);
        assertThat(result.get("totalElements")).isEqualTo(1L);
    }

    @Test
    void setRole_validatesAllowedRoles() {
        assertThatThrownBy(() -> adminService.setRole(1L, "HACKER"))
            .hasMessageContaining("Invalid role");
    }

    @Test
    void setRole_updatesUserRole() {
        User u = User.builder().id(1L).username("a").email("a@t.com").role("STUDENT").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(postRepository.countByAuthorId(any())).thenReturn(0L);
        when(commentRepository.countByAuthorId(any())).thenReturn(0L);

        adminService.setRole(1L, "ADMIN");
        assertThat(u.getRole()).isEqualTo("ADMIN");
        verify(userRepository).save(u);
    }

    @Test
    void deleteUser_anonymizesInsteadOfHardDelete() {
        User u = User.builder().id(5L).username("real").email("real@t.com").bio("b").build();
        when(userRepository.findById(5L)).thenReturn(Optional.of(u));

        adminService.deleteUser(5L);
        assertThat(u.getUsername()).isEqualTo("deleted_user_5");
        assertThat(u.getEmail()).isEqualTo("deleted_5@deleted.invalid");
        assertThat(u.getBio()).isNull();
        verify(userRepository).save(u);
    }

    @Test
    void getConfig_createsDefaultWhenMissing() {
        when(siteConfigRepository.findById(1L)).thenReturn(Optional.empty());
        when(siteConfigRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SiteConfig cfg = adminService.getConfig();
        assertThat(cfg.getId()).isEqualTo(1L);
    }

    @Test
    void updateConfig_updatesProvidedFieldsOnly() {
        SiteConfig existing = SiteConfig.builder().id(1L).siteName("Old").build();
        existing.setSiteTagline("Tag");
        when(siteConfigRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(siteConfigRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Simulate a partial PATCH — only siteName set, other fields null
        SiteConfig req = org.mockito.Mockito.mock(SiteConfig.class);
        when(req.getSiteName()).thenReturn("New");
        when(req.getSiteTagline()).thenReturn(null);
        when(req.getPrimaryColor()).thenReturn(null);
        when(req.getLogoUrl()).thenReturn(null);

        SiteConfig out = adminService.updateConfig(req);
        assertThat(out.getSiteName()).isEqualTo("New");
        assertThat(out.getSiteTagline()).isEqualTo("Tag");
    }
}
