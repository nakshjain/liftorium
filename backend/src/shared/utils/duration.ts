const durationPattern = /^(\d+)([smhd])$/;

const unitToMilliseconds = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000
} as const;

export const durationToMilliseconds = (duration: string) => {
  const match = durationPattern.exec(duration);

  if (!match) {
    throw new Error(`Invalid duration value: ${duration}`);
  }

  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof unitToMilliseconds;

  return amount * unitToMilliseconds[unit];
};
