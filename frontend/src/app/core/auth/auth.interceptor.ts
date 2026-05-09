import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { BYPASS_AUTH_INTERCEPTOR } from './auth.context';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(BYPASS_AUTH_INTERCEPTOR)) {
    return next(request);
  }

  const authService = inject(AuthService);
  const accessToken = authService.accessToken();
  const authenticatedRequest = accessToken
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        },
        withCredentials: true
      })
    : request.clone({
        withCredentials: true
      });

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return authService.refreshSession().pipe(
        switchMap(() => {
          const refreshedToken = authService.accessToken();

          if (!refreshedToken) {
            authService.clearSession();
            return throwError(() => error);
          }

          return next(
            request.clone({
              setHeaders: {
                Authorization: `Bearer ${refreshedToken}`
              },
              withCredentials: true
            })
          );
        }),
        catchError(() => {
          authService.clearSession();
          return throwError(() => error);
        })
      );
    })
  );
};
