import { APP_INITIALIZER } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { RouteReuseStrategy, provideRouter } from "@angular/router";
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from "@ionic/angular/standalone";
import { provideAnimations } from "@angular/platform-browser/animations";

import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";
import { initStore } from "./app/services/local-store";

bootstrapApplication(AppComponent, {
  providers: [
    // Load saved data from the device before any page or service starts.
    { provide: APP_INITIALIZER, useFactory: () => initStore, multi: true },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({}),
    provideRouter(routes),
    provideAnimations(),
  ],
});
