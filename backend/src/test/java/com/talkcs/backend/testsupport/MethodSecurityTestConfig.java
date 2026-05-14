package com.talkcs.backend.testsupport;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * Enables @PreAuthorize/@PostAuthorize in @WebMvcTest slices.
 * Pair with @WithMockUser(roles=...) to assert role-based denial.
 */
@TestConfiguration
@EnableMethodSecurity
public class MethodSecurityTestConfig {
}
