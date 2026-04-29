import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireModule } from '@angular/fire/compat';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { EffectsModule } from '@ngrx/effects';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { StoreModule } from '@ngrx/store';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ToastrModule } from 'ngx-toastr';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CartEffects } from './store/Cart/cart.effects';
import { CandidateEffects } from './store/Candidate/candidate.effects';
import { ChatEffects } from './store/Chat/chat.effect';
import { CustomerEffects } from './store/customer/customer.effects';
import { FakeBackendInterceptor } from './core/helpers/fake-backend';
import { FilemanagerEffects } from './store/filemanager/filemanager.effects';
import { InvoiceDataEffects } from './store/Invoices/invoice.effects';
import { JoblistEffects } from './store/Job/job.effects';
import { KeycloakService } from './auth/keycloak.service';
import { KeycloakTokenInterceptor } from './auth/keycloak-token.interceptor';
import { MailEffects } from './store/Email/email.effects';
import { OrderEffects } from './store/orders/order.effects';
import { OrdersEffects } from './store/Crypto/crypto.effects';
import { ProjectEffects } from './store/ProjectsData/project.effects';
import { SharedModule } from './cyptolanding/shared/shared.module';
import { AuthenticationEffects } from './store/Authentication/authentication.effects';
import { CyptolandingComponent } from './cyptolanding/cyptolanding.component';
import { ErrorInterceptor } from './core/helpers/error.interceptor';
import { ExtrapagesModule } from './extrapages/extrapages.module';
import { LayoutsModule } from './layouts/layouts.module';
import { environment } from '../environments/environment';
import { initFirebaseBackend } from './authUtils';
import { rootReducer } from './store';
import { tasklistEffects } from './store/Tasks/tasks.effect';
import { usersEffects } from './store/UserGrid/user.effects';
import { userslistEffects } from './store/UserList/userlist.effect';

if (environment.defaultauth === 'firebase') {
  initFirebaseBackend(environment.firebaseConfig);
}

export function createTranslateLoader(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

export function initializeKeycloak(keycloak: KeycloakService): () => Promise<boolean> {
  return () => keycloak.init();
}

@NgModule({
  declarations: [
    AppComponent,
    CyptolandingComponent
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
    LayoutsModule,
    ExtrapagesModule,
    AccordionModule.forRoot(),
    TabsModule.forRoot(),
    TooltipModule.forRoot(),
    ScrollToModule.forRoot(),
    SlickCarouselModule,
    ToastrModule.forRoot(),
    SharedModule,
    StoreModule.forRoot(rootReducer),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
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
    ])
  ],
  bootstrap: [AppComponent],
  providers: [
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      deps: [KeycloakService],
      multi: true
    },
    { provide: HTTP_INTERCEPTORS, useClass: KeycloakTokenInterceptor, multi: true },
    ...(environment.defaultauth === 'fakebackend' && !environment.production
      ? [{ provide: HTTP_INTERCEPTORS, useClass: FakeBackendInterceptor, multi: true }]
      : []),
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ]
})
export class AppModule { }
