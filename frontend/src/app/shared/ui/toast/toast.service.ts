import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: { label: string; handler: () => void };
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts = signal<Toast[]>([]);
  readonly activeToasts = this.toasts.asReadonly();

  show(message: string, type: ToastType = 'info', action?: { label: string; handler: () => void }): void {
    const id = crypto.randomUUID();
    const toast: Toast = { id, type, message, action };

    this.toasts.update((current) => [...current, toast]);

    // Auto-dismiss after 5 seconds if no action
    if (!action) {
      setTimeout(() => this.dismiss(id), 5000);
    }
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string, action?: { label: string; handler: () => void }): void {
    this.show(message, 'error', action);
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
