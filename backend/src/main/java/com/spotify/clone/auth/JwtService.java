package com.spotify.clone.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.spotify.clone.config.AppProperties;
import com.spotify.clone.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

  private final SecretKey key;
  private final Duration ttl;

  public JwtService(AppProperties props) {
    // Báo lỗi nếu JWT_SECRET quá ngắn (< 256 bit)
    this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(props.jwt().secret()));
    this.ttl = props.jwt().accessTokenTtl();
  }

  public String generateToken(User user) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(String.valueOf(user.getId()))
        .claim("role", user.getRole().name())     // chỉ để FE đọc; BE vẫn lấy role từ DB
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(ttl)))
        .signWith(key)
        .compact();
  }

  /** Trả về userId; ném JwtException nếu token sai chữ ký / hết hạn / sai định dạng. */
  public Long parseUserId(String token) {
    Claims claims = Jwts.parser().verifyWith(key).build()
        .parseSignedClaims(token)
        .getPayload();
    return Long.valueOf(claims.getSubject());
  }

  public Duration getTtl() { return ttl; }
}


