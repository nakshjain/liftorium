package com.liftorium.service;

import java.text.Normalizer;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ExerciseCatalogNormalizer {

  public String normalizeName(String value) {
    String ascii = Normalizer.normalize(value, Normalizer.Form.NFKD)
        .replaceAll("\\p{M}", "");
    return ascii.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
  }

  public String slug(String name, String providerExerciseId) {
    String base = normalizeName(name)
        .replaceAll("[^a-z0-9]+", "-")
        .replaceAll("(^-|-$)", "");
    String suffix = providerExerciseId.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    suffix = suffix.substring(Math.max(0, suffix.length() - 8));
    return base + "-" + suffix;
  }

  public List<String> searchPrefixes(String name, List<String> aliases) {
    Set<String> prefixes = new LinkedHashSet<>();
    addPrefixes(prefixes, normalizeName(name));
    aliases.stream().map(this::normalizeName).forEach(value -> addPrefixes(prefixes, value));
    return List.copyOf(prefixes);
  }

  private void addPrefixes(Set<String> prefixes, String value) {
    addPrefixRange(prefixes, value);
    for (String token : value.split(" ")) {
      addPrefixRange(prefixes, token);
    }
  }

  private void addPrefixRange(Set<String> prefixes, String value) {
    for (int length = 2; length <= value.length(); length++) {
      prefixes.add(value.substring(0, length));
    }
  }
}
