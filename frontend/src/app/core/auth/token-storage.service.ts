import { Injectable } from '@angular/core';

const accessTokenKey = 'liftorium_access_token';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  public getAccessToken(): string | null {
    return localStorage.getItem(accessTokenKey);
  }

  public setAccessToken(accessToken: string): void {
    localStorage.setItem(accessTokenKey, accessToken);
  }

  public clearAccessToken(): void {
    localStorage.removeItem(accessTokenKey);
  }
}
