package com.liftorium.security;

import com.liftorium.entity.User;
import java.util.Collection;
import java.util.Set;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Getter
public class UserPrincipal implements UserDetails {

  private final String id;
  private final String email;
  private final String displayName;
  private final String password;
  private final Collection<? extends GrantedAuthority> authorities;

  public UserPrincipal(User user) {
    this.id = user.getId();
    this.email = user.getEmail();
    this.displayName = user.getDisplayName();
    this.password = user.getPasswordHash();
    Set<String> roles = user.getRoles() == null || user.getRoles().isEmpty()
        ? Set.of("ROLE_USER")
        : user.getRoles();
    this.authorities = roles.stream()
        .map(SimpleGrantedAuthority::new)
        .toList();
  }

  @Override
  public String getUsername() {
    return email;
  }
}
