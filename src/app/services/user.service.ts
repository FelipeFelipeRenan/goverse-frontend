import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
}

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private baseUrl = 'http://localhost:8088'; // ou apenas /auth se estiver pelo gateway

    constructor(private http: HttpClient) {}

    createUser(userData: CreateUserPayload): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/auth/register`, userData);
    }
}