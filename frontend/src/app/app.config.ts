import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './services/auth-service';
import { authInterceptor } from './interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return auth.initializeAuth();
    })
  ],
};
