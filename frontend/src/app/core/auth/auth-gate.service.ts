import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthGateService {
  readonly pendingFeature = signal<string | null>(null);
  readonly returnUrl = signal<string>('');
}
