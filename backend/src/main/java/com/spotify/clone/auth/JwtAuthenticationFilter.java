package com.spotify.clone.auth;

import java.io.IOException;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import com.spotify.clone.user.User;
import com.spotify.clone.user.UserRepository;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/** Không gắn @Component: nếu là bean, Spring Boot sẽ đăng ký nó thêm một lần nữa vào servlet filter chain. */
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final String PREFIX = "Bearer ";

  private final JwtService jwtService;
  private final UserRepository userRepository;

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                  FilterChain chain) throws ServletException, IOException {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header == null || !header.startsWith(PREFIX)) {
      chain.doFilter(request, response);
      return;
    }

    try {
      Long userId = jwtService.parseUserId(header.substring(PREFIX.length()));
      userRepository.findById(userId)
          .filter(User::isEnabled)
          .map(AppUserDetails::from)
          .ifPresent(principal -> {
            var auth = UsernamePasswordAuthenticationToken.authenticated(
                principal, null, principal.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);
          });
    } catch (JwtException | IllegalArgumentException ex) {
      // Token không hợp lệ: không xác thực, để Security trả 401 nếu endpoint cần đăng nhập.
      SecurityContextHolder.clearContext();
    }

    chain.doFilter(request, response);
  }
}



