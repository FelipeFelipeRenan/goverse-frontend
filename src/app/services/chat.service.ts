import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';

export interface Message {
    id?: string;
    type?: 'CHAT' | 'PRESENCE' | 'TYPING_START' | 'TYPING_STOP' | 'SIGNAL' | 'DIRECT' | 'ERROR';
    content: string;
    room_id: string;
    user_id: string;
    username: string;
    target_user_id?: string;
    CreatedAt?: string;
}

export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

const MAX_ATTEMPTS = 10;

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    private apiUrl = environment.apiUrl;
    private wsUrl = environment.wsUrl;

    private socket$: WebSocketSubject<Message> | null = null;
    private roomId: string | null = null;
    private attempt = 0;
    private manualClose = false;
    private retryTimer: ReturnType<typeof setTimeout> | null = null;

    private incoming$ = new Subject<Message>();
    private status = new BehaviorSubject<ConnectionStatus>('closed');
    private reconnected = new Subject<void>();

    /** Estado da conexão, para mostrar "reconectando…" na tela. */
    readonly status$ = this.status.asObservable();
    /** Emite quando a conexão volta depois de uma queda: hora de recarregar o histórico. */
    readonly reconnected$ = this.reconnected.asObservable();

    constructor(private http: HttpClient) {}

    // Busca o historico de mensagens, via http
    getHistory(roomId: string): Observable<Message[]> {
        // cookie é anexado via CredentialsInterceptor e csrf token via CsrfInterceptor
        return this.http.get<Message[]>(`${this.apiUrl}/rooms/${roomId}/messages`);
    }

    // Conecta ao WebSocket (reconecta sozinho com backoff se cair)
    connect(roomId: string): void {
        this.disconnect();
        this.manualClose = false;
        this.roomId = roomId;
        this.attempt = 0;
        this.status.next('connecting');
        this.open();
    }

    private open(): void {
        const socket = webSocket<Message>({
            // O backend ja pega o cookie de auth automaticamente
            url: `${this.wsUrl}?roomId=${this.roomId}`,
            openObserver: {
                next: () => {
                    const wasReconnect = this.attempt > 0;
                    this.attempt = 0;
                    this.status.next('open');
                    if (wasReconnect) this.reconnected.next();
                },
            },
        });
        this.socket$ = socket;
        socket.subscribe({
            next: (m) => this.incoming$.next(m),
            error: () => this.scheduleReconnect(socket),
            complete: () => this.scheduleReconnect(socket),
        });
    }

    private scheduleReconnect(from: WebSocketSubject<Message>): void {
        // ignora eventos de um socket antigo ou fechado de propósito
        if (this.manualClose || this.socket$ !== from) return;
        this.socket$ = null;
        if (this.attempt >= MAX_ATTEMPTS) {
            this.status.next('closed');
            return;
        }
        this.status.next('reconnecting');
        const delay = Math.min(1000 * 2 ** this.attempt, 15000);
        this.attempt++;
        this.retryTimer = setTimeout(() => this.open(), delay);
    }

    /** Envia pelo socket. Devolve false se não está conectado (a tela avisa o usuário). */
    sendMessage(message: Partial<Message>): boolean {
        if (!this.socket$ || this.status.value !== 'open') return false;
        this.socket$.next(message as Message);
        return true;
    }

    // Desconecta (de propósito: não reconecta)
    disconnect(): void {
        this.manualClose = true;
        if (this.retryTimer) clearTimeout(this.retryTimer);
        this.retryTimer = null;
        const s = this.socket$;
        this.socket$ = null;
        s?.complete();
        this.status.next('closed');
    }

    // Mensagens recebidas (um único fluxo, sobrevive a reconexões)
    onNewMessage(): Observable<Message> {
        return this.incoming$.asObservable();
    }
}
