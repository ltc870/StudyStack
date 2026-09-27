import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';
import { catchError, from, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();


  const authReq = token 
    ? req.clone({ setHeaders: {Authorization: `Bearer ${token}`} }) : req;

    return next(authReq).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return from(authService.initializeAuth()).pipe(
            switchMap(() => {
              const newToken = authService.getAccessToken();
              const retriedReq = newToken
                ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}`} })
                : req;
              return next(retriedReq)
            })
          );
        }
        return throwError(() => error);
      })
    );
};
