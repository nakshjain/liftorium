export type AuthUserDto = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthSession = {
  user: AuthUserDto;
  accessToken: string;
  refreshToken: string;
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
  displayName: string;
};

export type RefreshTokenPayload = {
  sub: string;
  tokenId: string;
};
