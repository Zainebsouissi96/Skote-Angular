import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { KeycloakService } from '../../auth/keycloak.service';
import { AuthenticationService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(
        private authenticationService: AuthenticationService,
        private keycloakService: KeycloakService
    ) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        return next.handle(request).pipe(catchError(err => {
            if (err.status === 401) {
                if (environment.defaultauth === 'keycloak') {
                    this.keycloakService.logout();
                } else {
                    this.authenticationService.logout();
                    location.reload();
                }
            }

            const error = err.error?.message || err.statusText || err.message || 'HTTP error';
            return throwError(() => error);
        }));
    }
}
