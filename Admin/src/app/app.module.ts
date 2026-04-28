import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { environment } from '../environments/environment';

// Keycloak
import { KeycloakService } from './auth/keycloak.service';
import { KeycloakTokenInterceptor } from './auth/keycloak-token.interceptor'; // 👈 Ajouté

// Swiper Slider
import { SlickCarouselModule } from 'ngx-slick-carousel';

// bootstrap component
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { ToastrModule } from 'ngx-toastr';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';
import { SharedModule } from './cyptolanding/shared/shared.module';

// Store
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';

// Pages
import { ExtrapagesModule } from './extrapages/extrapages.module';
import { LayoutsModule } from './layouts/layouts.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { initFirebaseBackend } from './authUtils';
import { CyptolandingComponent } from './cyptolanding/cyptolanding.component';

// Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// HTTP
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';

// Interceptors existants
import { ErrorInterceptor } from './core/helpers/error.interceptor';
import { JwtInterceptor } from './core/helpers/jwt.interceptor';
import { FakeBackendInterceptor } from './core/helpers/fake-backend';

// Firebase
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';

// Effects
import { FilemanagerEffects } from './store/filemanager/filemanager.effects';
import { rootReducer } from './store';
import { OrderEffects } from './store/orders/order.effects';
import { AuthenticationEffects } from './store/Authentication/authentication.effects';
import { CartEffects } from './store/Cart/cart.effects';
import { ProjectEffects } from './store/ProjectsData/project.effects';
import { usersEffects } from './store/UserGrid/user.effects';
import { userslistEffects } from './store/UserList/userlist.effect';
import { JoblistEffects } from './store/Job/job.effects';
import { CandidateEffects } from './store/Candidate/candidate.effects';
import { InvoiceDataEffects } from './store/Invoices/invoice.effects';
import { ChatEffects } from './store/Chat/chat.effect';
import { tasklistEffects } from './store/Tasks/tasks.effect';
import { OrdersEffects } from './store/Crypto/crypto.effects';
import { CustomerEffects } from './store/customer/customer.effects';
import { MailEffects } from './store/Email/email.effects';

// Firebase init
if (environment.defaultauth === 'firebase') {
  initFirebaseBackend(environment.firebaseConfig);
} else {
  // FakeBackendInterceptor est activé plus bas dans les providers (conditionnellement recommandé)
}

// Translate loader
export function createTranslateLoader(http: HttpClient): any {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

// Initialisation Keycloak
export function initializeKeycloak(keycloak: KeycloakService) {
  return () => keycloak.init();
}

@NgModule({
  declarations: [
    AppComponent,
    
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,

    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,

    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),

    AppRoutingModule,

    AccordionModule.forRoot(),
    TabsModule.forRoot(),
    TooltipModule.forRoot(),

    ScrollToModule.forRoot(),
    SlickCarouselModule,
    ToastrModule.forRoot(),

    StoreModule.forRoot(rootReducer),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
    }),

    EffectsModule.forRoot([
      FilemanagerEffects,
      OrderEffects,
      AuthenticationEffects,
      CartEffects,
      ProjectEffects,
      usersEffects,
      userslistEffects,
      JoblistEffects,
      CandidateEffects,
      InvoiceDataEffects,
      ChatEffects,
      tasklistEffects,
      OrdersEffects,
      CustomerEffects,
      MailEffects
    ]),
  ],
  bootstrap: [AppComponent],
  providers: [
    // Keycloak
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      deps: [KeycloakService],
      multi: true,
    },

    // INTERCEPTEURS : l'ordre est important
    // 1. Intercepteur de token (Keycloak) – ajoute le Bearer token
    { provide: HTTP_INTERCEPTORS, useClass: KeycloakTokenInterceptor, multi: true },

    // 2. JwtInterceptor (si vous gardez un fallback JWT, mais Keycloak le remplace idéalement)
    // { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }, // ❌ À désactiver si Keycloak est utilisé

    // 3. FakeBackendInterceptor (uniquement si vous simulez une API, hors production)
    ...(environment.defaultauth !== 'firebase' && !environment.production
      ? [{ provide: HTTP_INTERCEPTORS, useClass: FakeBackendInterceptor, multi: true }]
      : []),

    // 4. ErrorInterceptor – toujours en dernier pour capturer les erreurs
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
})
export class AppModule { }