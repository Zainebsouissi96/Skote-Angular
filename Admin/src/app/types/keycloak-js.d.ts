declare module 'keycloak-js' {
  export interface KeycloakServerConfig {
    url: string;
    realm: string;
    clientId: string;
  }

  export default class Keycloak {
    authenticated?: boolean;
    token?: string;
    tokenParsed?: any;
    idTokenParsed?: any;

    constructor(config?: KeycloakServerConfig);

    init(options?: any): Promise<boolean>;
    login(options?: any): Promise<void>;
    logout(options?: any): Promise<void>;
    updateToken(minValidity?: number): Promise<boolean>;
    loadUserInfo(): Promise<any>;
  }
}
