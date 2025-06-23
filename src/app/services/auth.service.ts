import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface LoginRequest {
    email: string;
    password: string;
    type: string;
}

interface LoginResponse {
    token: string;
}

interface DecodedToken {
    user_id: string;
    user_email: string;
    exp: number;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly API_URL = 'http://localhost:8088';
    constructor(private http: HttpClient) {}

    login(data: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(
            `${this.API_URL}/auth/login`,
            data
        );
    }

    saveToken(token: string) {
        localStorage.setItem('access_token', token);
    }

    getToken(): string | null {
        return localStorage.getItem('access_token');
    }

    logout() {
        localStorage.removeItem('access_token');
    }

    getUserFromToken(): DecodedToken | null {
        const token = this.getToken();

        if(!token) return null;

        try{
            return jwtDecode<DecodedToken>(token)
        } catch(error){
            console.error('Erro ao decodificar token: ', error)
            return null
        }
    }
}
