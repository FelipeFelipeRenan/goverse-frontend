import { CommonModule } from '@angular/common';
import {
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ElementRef,
    AfterViewChecked,
    ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService, Message } from '../../services/chat.service';
import { Subscription, timer, Subject, EMPTY } from 'rxjs';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
    selector: 'app-room',
    standalone: true, // <-- ADICIONADO
    imports: [CommonModule, FormsModule],
    templateUrl: './room.component.html',
    styleUrls: ['./room.component.css'], // <-- Corrigido de 'styleUrl'
})
export class RoomComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

    public messages: Message[] = [];
    public newMessageContent: string = '';
    public roomName: string = 'Carregando...';
    public isLoadingHistory: boolean = true;
    public typingUser: string | null = null;
    public errorMessage: string | null = null; // Para erros de API

    private roomId: string | null = null;
    private currentUser: User | null = null;
    private socketSubscription: Subscription | null = null;

    private typingSubject = new Subject<void>();
    private stopTypingTimer = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private chatService: ChatService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef // Para forçar a detecção de mudanças
    ) {}

    ngOnInit(): void {
        console.log('RoomComponent ngOnInit executado!');
        this.authService.currentUser$.subscribe(
            (user) => (this.currentUser = user)
        ); // --- CORREÇÃO DO BUG CRÍTICO ---

        this.roomId = this.route.snapshot.paramMap.get('id'); // <-- Corrigido de 'get' para 'id'

        if (this.roomId) {
            console.log(`Buscando dados para a sala: ${this.roomId}`);
            this.roomName = `Sala ${this.roomId}`; // TODO: Pegar o nome real // Busca o historico de mensagens

            this.chatService
                .getHistory(this.roomId)
                .pipe(
                    catchError((err) => {
                        console.error('Falha ao buscar histórico:', err);
                        this.errorMessage =
                            'Erro ao carregar histórico. Você pode não ter permissão para ver esta sala.';
                        this.isLoadingHistory = false;
                        return EMPTY; // Para o fluxo
                    })
                )
                .subscribe((history) => {
                    console.log('Histórico recebido:', history);
                    this.messages = history;
                    this.isLoadingHistory = false;
                    this.cdr.detectChanges(); // Força a UI a atualizar
                    this.scrollToBottom('instant');
                }); // Conecta ao websocket

            this.chatService.connect(this.roomId); // "escuta" por novas mensagens do websocket

            this.socketSubscription = this.chatService.onNewMessage().subscribe(
                (newMessage) => this.handleNewMessage(newMessage),
                (err) => console.error('Erro no WebSocket: ', err),
                () => console.warn('WebSocket fechado')
            );

            this.setupTypingHandlers();
        } else {
            console.error('Nenhum ID de sala encontrado na URL!');
            this.errorMessage = 'Nenhum ID de sala foi fornecido.';
            this.isLoadingHistory = false;
        }
    }

    ngAfterViewChecked(): void {
        // Rola apenas se não estivermos no meio de um carregamento
        if (!this.isLoadingHistory) {
            this.scrollToBottom('smooth');
        }
    }

    scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
        try {
            if (this.myScrollContainer) {
                this.myScrollContainer.nativeElement.scrollTo({
                    top: this.myScrollContainer.nativeElement.scrollHeight,
                    behavior: behavior,
                });
            }
        } catch (err) {}
    }

    handleNewMessage(msg: Message): void {
        console.log('Nova mensagem recebida:', msg);

        if (
            msg.type === 'TYPING_START' &&
            msg.user_id !== this.currentUser?.id
        ) {
            this.typingUser = msg.username;
            timer(3000)
                .pipe(takeUntil(this.stopTypingTimer))
                .subscribe(() => {
                    this.typingUser = null;
                });
        } else if (msg.type === 'TYPING_STOP') {
            if (this.typingUser === msg.username) {
                this.typingUser = null;
                this.stopTypingTimer.next();
            }
        } else {
            this.messages.push(msg);
            if (
                this.typingUser === msg.username &&
                msg.user_id === this.currentUser?.id
            ) {
                this.typingUser = null;
                this.stopTypingTimer.next();
            }
        }
        this.cdr.detectChanges(); // Força a UI a atualizar
    }

    setupTypingHandlers(): void {
        this.typingSubject
            .pipe(
                switchMap(() => {
                    this.chatService.sendMessage({
                        type: 'TYPING_START',
                        content: '',
                        room_id: this.roomId || '',
                    });
                    return timer(2000); // Envia a cada 2s
                })
            )
            .subscribe();
    }

    sendTypingEvent(): void {
        this.typingSubject.next();
    }

    sendMessage(): void {
        if (this.newMessageContent.trim() && this.roomId) {
            const msg: Partial<Message> = {
                type: 'CHAT',
                content: this.newMessageContent,
                room_id: this.roomId,
            };
            this.chatService.sendMessage(msg);
            this.newMessageContent = '';
            this.stopTypingTimer.next(); // Para o timer de "digitando"
            this.typingUser = null;
        }
    }

    isMyMessage(messageUserId: string): boolean {
        return this.currentUser?.id === messageUserId;
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }

    ngOnDestroy(): void {
        console.log('RoomComponent ngOnDestroy: Desconectando.');
        this.chatService.disconnect();
        if (this.socketSubscription) {
            this.socketSubscription.unsubscribe();
        }
        this.stopTypingTimer.complete();
        this.typingSubject.complete();
    }
}
