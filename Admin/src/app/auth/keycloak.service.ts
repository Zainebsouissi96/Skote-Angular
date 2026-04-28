import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import type { KeycloakInitOptions, KeycloakInstance } from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private keycloak!: KeycloakInstance;

  init(): Promise<boolean> {
    this.keycloak = new Keycloak({
      url: 'http://localhost:8080',           // 👈 Adaptez à votre serveur Keycloak
      realm: 'rhcamunda-realm',               // 👈 Votre realm
      clientId: 'angular-frontend'            // 👈 Votre client ID
    });

    const options: KeycloakInitOptions = {
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false
    };

    return this.keycloak
      .init(options)
      .then((authenticated) => {
        console.log('🔐 Keycloak authenticated:', authenticated);
        this.startTokenRefresh();
        return authenticated;
      })
      .catch((err) => {
        console.error('❌ Keycloak init failed', err);
        return false;
      });
  }

  getToken(): string | undefined {
    return this.keycloak?.token;
  }

  getUsername(): string | undefined {
    return this.keycloak?.tokenParsed?.preferred_username;
  }

  logout(): void {
    this.keycloak.logout({ redirectUri: window.location.origin });
  }

  login(): void {
    this.keycloak.login();
  }

  isLoggedIn(): boolean {
    return !!this.keycloak?.authenticated;
  }

  private startTokenRefresh(): void {
    setInterval(() => {
      this.keycloak
        .updateToken(70)
        .then((refreshed) => {
          if (refreshed) console.log('🔄 Token refreshed');
        })
        .catch(() => {
          console.warn('⚠️ Token refresh failed, logging out');
          this.logout();
        });
    }, 60000);
  }
}