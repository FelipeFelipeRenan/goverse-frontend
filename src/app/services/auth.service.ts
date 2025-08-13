import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
    id: string;
    username: string;
    email: string;
    picture?: string;
    created_at: string; // O JSON geralmente converte datas para string
    is_oauth: boolean;
}

interface LoginRequest {
    email: string;
    password: string;
    type: string;
}

interface LoginResponse {
    user: User;
    csrf_token: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly API_URL = 'http://localhost';

    private userSubject = new BehaviorSubject<User | null>(null);

    public currentUser$ = this.userSubject.asObservable();

    private csrfToken: string | null = null;

    constructor(private http: HttpClient) {}

    login(data: LoginRequest): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(`${this.API_URL}/auth/login`, data)
            .pipe(
                tap((response) => {
                    this.csrfToken = response.csrf_token;

                    this.userSubject.next(response.user);
                })
            );
    }

    logout(): Observable<any> {
        return this.http.post(`${this.API_URL}/auth/logout`, {}).pipe(
            tap(() => {
                this.csrfToken = null;
                this.userSubject.next(null);
            })
        );
    }

    public getCurrentUser(): User | null {
        return this.userSubject.value;
    }

    public getCsrfToken(): string | null {
        return this.csrfToken;
    }
}
