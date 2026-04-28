import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KeycloakService } from './keycloak.service';

@Injectable()
export class KeycloakTokenInterceptor implements HttpInterceptor {
  constructor(private keycloakService: KeycloakService) {}

  // @ts-ignore - contournement d’une incompatibilité de typage résiduelle
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ne pas intercepter les requêtes vers Keycloak
    if (req.url.includes('/auth/') || req.url.includes('keycloak')) {
      return next.handle(req);
    }

    const token = this.keycloakService.getToken();
    if (token) {
      const cloned = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      return next.handle(cloned);
    }
    return next.handle(req);
  }
}