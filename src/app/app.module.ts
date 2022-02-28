import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {UserModule} from "./user/user.module";
import { NavComponent } from './nav/nav.component';
import {AngularFireModule} from "@angular/fire/compat";
import {environment} from "../environments/environment";
import {AngularFireAuthModule} from "@angular/fire/compat/auth";
import {AngularFirestoreModule} from "@angular/fire/compat/firestore";
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ClipComponent } from './clip/clip.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ClipslistComponent } from './clipslist/clipslist.component';
import { FbTimestampPipe } from './pipes/fb-timestamp.pipe';


@NgModule({

  declarations: [
    AppComponent,
    NavComponent,
    HomeComponent,
    AboutComponent,
    ClipComponent,
    NotFoundComponent,
    ClipslistComponent,
    FbTimestampPipe
  ],
  imports: [
    BrowserModule,
    UserModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFirestoreModule,
    AppRoutingModule, //fica em ultimo p evitar problemas no wildcard **

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
