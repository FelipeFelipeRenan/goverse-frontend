import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RoomMembersComponent } from './pages/room-members/room-members.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },

    {
        path: 'home',
        loadComponent: () =>
            import('./pages/home/home.component').then((m) => m.HomeComponent),
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'rooms/:roomID/members', component: RoomMembersComponent },
    {
        path: 'signup',
        loadComponent: () =>
            import('./pages/signup/signup.component').then(
                (m) => m.SignupComponent
            ),
    },
    {
        path: 'debug',
        loadComponent: () =>
            import('./pages/signup/signup.component').then(
                (m) => m.SignupComponent
            ),
    },
];
