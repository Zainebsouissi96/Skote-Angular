import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../environments/environment';
import { ALL_RH_ROLES, normalizeRhRole } from './keycloak-roles';

interface ParsedKeycloakToken extends Record<string, unknown> {
  preferred_username?: string;
  name?: string;
  email?: string;
  groups?: string[];
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
}

declare global {
  interface Window {
    rhKeycloakDebug?: () => Record<string, unknown>;
  }
}

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private keycloak?: any;
  private refreshTimer?: ReturnType<typeof setInterval>;
  private userInfo?: Record<string, unknown>;

  init(): Promise<boolean> {
    if (!this.isEnabled()) {
      return Promise.resolve(true);
    }

    if (this.keycloak) {
      return Promise.resolve(this.isLoggedIn());
    }

    this.keycloak = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId
    });

    const onLoad = this.getOnLoadMode();

    return this.keycloak.init({
      onLoad,
      pkceMethod: 'S256',
      checkLoginIframe: false,
      ...(onLoad === 'check-sso'
        ? { silentCheckSsoRedirectUri: `${window.location.origin}/assets/silent-check-sso.html` }
        : {})
    }).then(async (authenticated: boolean) => {
      if (authenticated) {
        await this.loadUserInfo();
        this.exposeDebugHelper();
        this.startTokenRefresh();
      }

      return authenticated;
    }).catch((error: unknown) => {
      console.error('Keycloak initialization failed', error);
      return false;
    });
  }

  isEnabled(): boolean {
    return environment.defaultauth === 'keycloak';
  }

  isLoggedIn(): boolean {
    return !!this.keycloak?.authenticated;
  }

  async login(redirectUri: string = window.location.href): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    await this.ensureClient();
    await this.keycloak?.login({ redirectUri });
  }

  async logout(redirectUri: string = window.location.origin): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    this.stopTokenRefresh();
    await this.keycloak?.logout({ redirectUri });
  }

  async getToken(): Promise<string | null> {
    if (!this.isEnabled() || !this.keycloak || !this.isLoggedIn()) {
      return null;
    }

    try {
      await this.keycloak.updateToken(30);
      return this.keycloak.token ?? null;
    } catch (error) {
      console.warn('Unable to refresh Keycloak token', error);
      await this.login();
      return null;
    }
  }

  getUsername(): string | null {
    return this.getParsedToken()?.preferred_username ?? null;
  }

  getDisplayName(): string | null {
    const token = this.getParsedToken();
    return token?.name ?? token?.preferred_username ?? null;
  }

  getEmail(): string | null {
    return this.getParsedToken()?.email ?? null;
  }

  getRoles(): string[] {
    const token = this.getParsedToken();
    const realmRoles = token?.realm_access?.roles ?? [];
    const clientRoles = token?.resource_access?.[environment.keycloak.clientId]?.roles ?? [];
    const tokenCandidates = this.collectRoleCandidates(token);
    const idTokenCandidates = this.collectRoleCandidates(this.keycloak?.idTokenParsed);
    const userInfoCandidates = this.collectRoleCandidates(this.userInfo);

    return Array.from(new Set([
      ...realmRoles,
      ...clientRoles,
      ...tokenCandidates,
      ...idTokenCandidates,
      ...userInfoCandidates
    ].map(normalizeRhRole)));
  }

  hasAnyRole(expectedRoles?: string[]): boolean {
    if (!this.isEnabled() || !expectedRoles?.length) {
      return true;
    }

    const userRoles = new Set(this.getRoles());
    const normalizedExpectedRoles = expectedRoles.map(normalizeRhRole);
    const hasExpectedRole = normalizedExpectedRoles.some((role) => userRoles.has(role));

    if (hasExpectedRole) {
      return true;
    }

    if (this.isRouteOpenToEveryRhRole(normalizedExpectedRoles) && !this.hasResolvedRhRole(userRoles)) {
      console.warn('Aucun role RH lisible dans le token Keycloak. Acces limite autorise pour la route commune.', {
        expectedRoles: normalizedExpectedRoles,
        resolvedRoles: Array.from(userRoles)
      });
      return true;
    }

    console.warn('Acces refuse par role Keycloak.', {
      expectedRoles: normalizedExpectedRoles,
      resolvedRoles: Array.from(userRoles)
    });
    return false;
  }

  private getParsedToken(): ParsedKeycloakToken | null {
    return this.keycloak?.tokenParsed ?? null;
  }

  private async loadUserInfo(): Promise<void> {
    try {
      this.userInfo = await this.keycloak?.loadUserInfo?.();
    } catch (error) {
      console.warn('Unable to load Keycloak user info', error);
      this.userInfo = undefined;
    }
  }

  private exposeDebugHelper(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.rhKeycloakDebug = () => ({
      resolvedRoles: this.getRoles(),
      accessTokenParsed: this.keycloak?.tokenParsed,
      idTokenParsed: this.keycloak?.idTokenParsed,
      userInfo: this.userInfo
    });
  }

  private collectRoleCandidates(source: unknown): string[] {
    const candidates: string[] = [];
    const visit = (value: unknown): void => {
      if (!value) {
        return;
      }

      if (typeof value === 'string') {
        candidates.push(value, this.getRoleNameFromGroup(value));
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }

      if (typeof value === 'object') {
        Object.values(value as Record<string, unknown>).forEach(visit);
      }
    };

    visit(source);
    return candidates;
  }

  private getRoleNameFromGroup(group: string): string {
    return group.split('/').filter(Boolean).pop() ?? group;
  }

  private isRouteOpenToEveryRhRole(expectedRoles: string[]): boolean {
    const expected = new Set(expectedRoles);
    return ALL_RH_ROLES.every((role) => expected.has(role));
  }

  private hasResolvedRhRole(userRoles: Set<string>): boolean {
    return ALL_RH_ROLES.some((role) => userRoles.has(role));
  }

  private getOnLoadMode(): 'check-sso' | 'login-required' {
    return environment.keycloak.onLoad === 'login-required' ? 'login-required' : 'check-sso';
  }

  private async ensureClient(): Promise<void> {
    if (!this.keycloak) {
      await this.init();
    }
  }

  private startTokenRefresh(): void {
    this.stopTokenRefresh();
    this.refreshTimer = setInterval(() => {
      this.keycloak?.updateToken(60).catch((error: unknown) => {
        console.warn('Keycloak token refresh failed', error);
        this.logout();
      });
    }, 60000);
  }

  private stopTokenRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }
}
