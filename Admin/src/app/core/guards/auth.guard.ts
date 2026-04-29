import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    CanActivateChild,
    Router,
    RouterStateSnapshot,
    UrlTree
} from '@angular/router';

import { KeycloakService } from '../../auth/keycloak.service';
import { AuthenticationService } from '../services/auth.service';
import { AuthfakeauthenticationService } from '../services/authfake.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {
    constructor(
        private router: Router,
        private keycloakService: KeycloakService,
        private authenticationService: AuthenticationService,
        private authFackservice: AuthfakeauthenticationService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Promise<boolean | UrlTree> {
        return this.authorize(route, state);
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Promise<boolean | UrlTree> {
        return this.authorize(route, state);
    }

    private async authorize(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
        if (environment.defaultauth === 'keycloak') {
            if (!this.keycloakService.isLoggedIn()) {
                await this.keycloakService.login(`${window.location.origin}${state.url}`);
                return false;
            }

            const expectedRoles = route.data['roles'] as string[] | undefined;
            if (!this.keycloakService.hasAnyRole(expectedRoles)) {
                return this.router.createUrlTree(['/pages/404']);
            }

            return true;
        }

        if (environment.defaultauth === 'firebase') {
            const currentUser = this.authenticationService.currentUser();
            if (currentUser) {
                return true;
            }
        } else {
            const currentUser = this.authFackservice.currentUserValue;
            if (currentUser || localStorage.getItem('currentUser')) {
                return true;
            }
        }

        return this.router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
    }
}
