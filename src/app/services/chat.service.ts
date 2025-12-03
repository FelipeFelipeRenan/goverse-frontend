import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';

export interface Message {
    id?: string;
    type?: 'CHAT' | 'PRESENCE' | 'TYPING_START' | 'TYPING_STOP' | 'SIGNAL' | 'DIRECT';
    content: string;
    room_id: string;
    user_id: string;
    username: string;
    target_user_id?: string;
    CreatedAt?: string;
}

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    // TODO: mover para environment.ts
    private apiUrl = environment.apiUrl;
    private wsUrl = environment.wsUrl;

    private socket$: WebSocketSubject<any> | null = null;

    constructor(private http: HttpClient) {}

    // Busca o historico de mensagens, via http
    getHistory(roomId: string): Observable<Message[]> {
        // cookie é anexado via CredentialsInterceptor e csrf token via CsrfInterceptor
        return this.http.get<Message[]>(
            `${this.apiUrl}/rooms/${roomId}/messages`
        );
    }

    // Conecta ao WebSocket
    connect(roomId: string): WebSocketSubject<Message> {
        if (!this.socket$ || this.socket$.closed) {
            // O backend ja pega o cookie de auth automaticamente
            this.socket$ = webSocket<Message>({
                // O WebSocketSubject já usa JSON.stringfy/parse por padrão
                url: `${this.wsUrl}?roomId=${roomId}`,
            });
        }
        return this.socket$;
    }

    // Envia uma mensagem
    sendMessage(message: Partial<Message>) {
        if (this.socket$) {
            this.socket$.next(message);
        }
    }

    // Desconecta
    disconnect() {
        if (this.socket$) {
            this.socket$.complete();
            this.socket$ = null;
        }
    }

    // Retorna o Observable do socket para o componente "ouvir"
    onNewMessage(): Observable<Message> {
        if (this.socket$) {
            return this.socket$.asObservable();
        }
        return EMPTY;
    }
}
