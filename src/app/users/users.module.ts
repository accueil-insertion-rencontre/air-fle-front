import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { UsersRoutingModule } from './users-routing.module';
import { UserListComponent } from './user-list/user-list.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    UsersRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    UserListComponent
  ]
})
export class UsersModule { }
