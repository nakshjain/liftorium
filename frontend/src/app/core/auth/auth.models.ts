export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthSessionData = {
  user: AuthUser;
  accessToken: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  email: string;
  password: string;
  displayName: string;
};

export type SignupInitiateRequest = {
  email: string;
  password: string;
  displayName: string;
};

export type SignupVerifyRequest = {
  email: string;
  otp: string;
};

export type SignupInitiateResponse = {
  message: string;
};

export type CurrentUserData = {
  user: AuthUser;
};

export type LogoutData = {
  loggedOut: boolean;
};

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous';
