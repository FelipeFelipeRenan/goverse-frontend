import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';

export interface User {
    id: string;
    username: string;
    email: string;
    picture?: string;
    created_at: string;
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

  private authCheckFinished = new BehaviorSubject<boolean>(false);
  public authCheckFinished$ = this.authCheckFinished.asObservable();

  private csrfToken: string | null = null;

  constructor(private http: HttpClient) {
    this.checkAuthStatus().subscribe();
  }

  checkAuthStatus(): Observable<User | null> {
    return this.http.get<User>(`${this.API_URL}/auth/me`).pipe(
      tap(user => this.userSubject.next(user)),
      catchError(() => {
        this.userSubject.next(null);
        return of(null);
      }),
      finalize(() => this.authCheckFinished.next(true))
    );
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, data).pipe(
      tap(response => {
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

  public getCsrfToken(): string | null {
    return this.csrfToken;
  }
}