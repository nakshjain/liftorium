import { Injectable } from '@angular/core';

const accessTokenKey = 'liftorium_access_token';
const loggedOutKey = 'liftorium_logged_out';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  public getAccessToken(): string | null {
    return localStorage.getItem(accessTokenKey);
  }

  public setAccessToken(accessToken: string): void {
    localStorage.setItem(accessTokenKey, accessToken);
    // Clear the logged-out flag whenever a new token is stored (new login)
    sessionStorage.removeItem(loggedOutKey);
  }

  public clearAccessToken(): void {
    localStorage.removeItem(accessTokenKey);
  }

  /** Mark that the user explicitly signed out. Stored in sessionStorage so it
   *  resets automatically when the browser tab is closed, but persists across
   *  in-tab navigation and reloads within the same session. */
  public setLoggedOut(): void {
    sessionStorage.setItem(loggedOutKey, '1');
  }

  public isLoggedOut(): boolean {
    return sessionStorage.getItem(loggedOutKey) === '1';
  }

  public clearLoggedOut(): void {
    sessionStorage.removeItem(loggedOutKey);
  }
}
