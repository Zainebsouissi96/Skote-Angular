import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { KeycloakService } from './keycloak.service';

@Injectable()
export class KeycloakTokenInterceptor implements HttpInterceptor {
  constructor(private keycloakService: KeycloakService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.shouldAttachToken(request)) {
      return next.handle(request);
    }

    return from(this.keycloakService.getToken()).pipe(
      switchMap((token) => {
        if (!token) {
          return next.handle(request);
        }

        return next.handle(request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        }));
      })
    );
  }

  private shouldAttachToken(request: HttpRequest<unknown>): boolean {
    if (!this.keycloakService.isEnabled()) {
      return false;
    }

    const url = request.url.toLowerCase();
    const keycloakUrl = environment.keycloak.url.toLowerCase();

    if (url.includes('/assets/') || url.endsWith('.json') || url.startsWith(keycloakUrl)) {
      return false;
    }

    return url.startsWith('/api')
      || url.startsWith(environment.apiBaseUrl.toLowerCase())
      || !url.startsWith('http');
  }
}
