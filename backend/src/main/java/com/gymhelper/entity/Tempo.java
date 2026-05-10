package com.gymhelper.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tempo {

  private Integer eccentric;
  private Integer pauseBottom;
  private Integer concentric;
  private Integer pauseTop;
}
