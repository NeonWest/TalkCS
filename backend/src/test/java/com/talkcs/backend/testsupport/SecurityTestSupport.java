package com.talkcs.backend.testsupport;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

public final class SecurityTestSupport {
    private SecurityTestSupport() {}

    public static void setAuth(String email, String... roles) {
        var authorities = roles.length == 0
            ? List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))
            : java.util.Arrays.stream(roles).map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList();
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(new UsernamePasswordAuthenticationToken(email, "n/a", authorities));
        SecurityContextHolder.setContext(ctx);
    }

    public static void clear() {
        SecurityContextHolder.clearContext();
    }
}
