# Integration Keycloak - Front Angular RH

## Parametres Angular

Les valeurs principales sont dans `src/environments/environment.ts` :

```ts
defaultauth: 'keycloak',
apiBaseUrl: 'http://localhost:8081/api',
keycloak: {
  url: 'http://localhost:8080',
  realm: 'rhcamunda-realm',
  clientId: 'angular-frontend',
  onLoad: 'check-sso'
}
```

En production, adaptez `src/environments/environment.prod.ts` avec l'URL reelle Keycloak.

## Client Keycloak

Creer un client public :

- Client ID : `angular-frontend`
- Client authentication : `Off`
- Standard flow : `On`
- PKCE : `S256`
- Valid redirect URIs : `http://localhost:4200/*`
- Web origins : `http://localhost:4200`

Pour la production, remplacer `localhost:4200` par le domaine du front.

## Roles a creer

Creer ces roles dans le realm ou dans le client :

- `EMPLOYE`
- `CHEF_HIERARCHIQUE`
- `RH`
- `ADMIN`

Le front accepte aussi les variantes `ROLE_EMPLOYE`, `ROLE_RH`, `ROLE_ADMIN`, `MANAGER` et les normalise cote Angular.

## Points branches dans Angular

- `KeycloakService` initialise Keycloak, lit le profil et les roles, et rafraichit le token.
- `KeycloakTokenInterceptor` ajoute `Authorization: Bearer <token>` aux appels API.
- `AuthGuard` protege les routes et verifie `data.roles`.
- Les pages `/auth/login` redirigent vers Keycloak en mode SSO.
- Les menus Dashboard et Contacts sont masques si le role ne correspond pas.

## Cote Spring Security

Le backend doit accepter le JWT Keycloak comme resource server. Exemple de propriete :

```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/rhcamunda-realm
```

Si Spring attend des authorities `ROLE_*`, mappez les roles Keycloak vers `ROLE_EMPLOYE`, `ROLE_CHEF_HIERARCHIQUE`, `ROLE_RH`, `ROLE_ADMIN` cote backend.
