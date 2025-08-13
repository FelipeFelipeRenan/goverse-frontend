import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CreateUserPayload {
    username: string;
    email: string;
    password: string;
}

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private baseUrl = 'http://localhost'; // ou apenas /auth se estiver pelo gateway

    constructor(private http: HttpClient) {}

    createUser(userData: CreateUserPayload): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/user`, userData);
    }

    getUserById(id: string): Observable<any>{
        return this.http.get<any>(`${this.baseUrl}/user/${id}`)
    }
}
