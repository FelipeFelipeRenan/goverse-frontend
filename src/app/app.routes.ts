import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SignupComponent } from './pages/signup/signup.component';
import { RoomMembersComponent } from './pages/room-members/room-members.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [authGuard], // <-- APLIQUE A GUARDA
    },
    {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [authGuard], // <-- APLIQUE A GUARDA
    },
    {
        path: 'rooms/:id/members',
        component: RoomMembersComponent,
        canActivate: [authGuard], // <-- APLIQUE A GUARDA
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }, // Rota coringa para qualquer outra URL
];
