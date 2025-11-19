import { CommonModule } from '@angular/common';
import {
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ElementRef,
    ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService, Message } from '../../services/chat.service';
import { Subscription, timer, Subject, EMPTY } from 'rxjs';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { RoomSidebarComponent } from '../../components/room-sidebar/room-sidebar.component';
import { RoomMember, RoomService } from '../../services/room.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-room',
    standalone: true,
    imports: [CommonModule, FormsModule, RoomSidebarComponent],
    templateUrl: './room.component.html',
    styleUrls: ['./room.component.css'],
})
export class RoomComponent implements OnInit, OnDestroy {
    @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

    public messages: Message[] = [];
    public newMessageContent: string = '';
    public roomName: string = 'Carregando...';
    public isLoadingHistory: boolean = true;
    public typingUser: string | null = null;
    public errorMessage: string | null = null;

    // propriedades para o sidebar
    public roomMembers: RoomMember[] = [];
    public isSidebarOpen = false;

    public roomId: string | null = null;
    public currentUser: User | null = null;

    // Subject para gerenciar o unsubscribe de tudo de uma vez
    private destroy$ = new Subject<void>();
    private typingSubject = new Subject<void>();
    private stopTypingTimer = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private chatService: ChatService,
        private authService: AuthService,
        private roomService: RoomService,
        private toastService: ToastService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        // 1. Correção Memory Leak: Usando takeUntil
        this.authService.currentUser$
            .pipe(takeUntil(this.destroy$))
            .subscribe((user) => (this.currentUser = user));

        this.roomId = this.route.snapshot.paramMap.get('id');

        if (this.roomId) {
            this.roomName = `Sala ${this.roomId}`;

            // Carrega histórico
            this.chatService
                .getHistory(this.roomId)
                .pipe(
                    takeUntil(this.destroy$), // Garante limpeza
                    catchError((err) => {
                        console.error('Erro:', err);
                        this.toastService.error(
                            'Não foi possível carregar o histórico da sala.'
                        );
                        this.isLoadingHistory = false;
                        return EMPTY;
                    })
                )
                .subscribe((history) => {
                    this.messages = history;
                    this.isLoadingHistory = false;
                    this.cdr.detectChanges();
                    // 2. Correção Performance: Scroll só roda uma vez aqui
                    this.scrollToBottom('instant');
                });

            this.chatService.connect(this.roomId);

            this.chatService
                .onNewMessage()
                .pipe(takeUntil(this.destroy$))
                .subscribe(
                    (newMessage) => this.handleNewMessage(newMessage),
                    (err) => console.error('Erro WS:', err)
                );

            this.setupTypingHandlers();
            this.loadRoomMembers();
        }
    }

    // Removemos o ngAfterViewChecked problemático

    scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
        setTimeout(() => {
            // Timeout para garantir que o DOM atualizou
            try {
                if (this.myScrollContainer) {
                    this.myScrollContainer.nativeElement.scrollTo({
                        top: this.myScrollContainer.nativeElement.scrollHeight,
                        behavior: behavior,
                    });
                }
            } catch (err) {}
        }, 100);
    }

    handleNewMessage(msg: Message): void {
        if (
            msg.type === 'TYPING_START' &&
            msg.user_id !== this.currentUser?.id
        ) {
            this.typingUser = msg.username;
            // Reinicia o timer de parar de digitar
            this.stopTypingTimer.next();
            timer(3000)
                .pipe(takeUntil(this.stopTypingTimer))
                .subscribe(() => (this.typingUser = null));
        } else if (msg.type === 'TYPING_STOP') {
            if (this.typingUser === msg.username) {
                this.typingUser = null;
                this.stopTypingTimer.next();
            }
        } else if (msg.type === 'CHAT' || !msg.type) {
            // Se for chat normal
            this.messages.push(msg);

            // Se quem estava digitando mandou a msg, limpa o status
            if (this.typingUser === msg.username) {
                this.typingUser = null;
                this.stopTypingTimer.next();
            }

            this.cdr.detectChanges();
            // Scroll apenas quando chega mensagem nova
            this.scrollToBottom('smooth');
        }
    }

    setupTypingHandlers(): void {
        this.typingSubject
            .pipe(
                takeUntil(this.destroy$),
                switchMap(() => {
                    this.chatService.sendMessage({
                        type: 'TYPING_START',
                        content: '',
                        room_id: this.roomId || '',
                    });
                    return timer(2000);
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
            this.stopTypingTimer.next();
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
        this.chatService.disconnect();
        // Cancela todas as subscrições de uma vez
        this.destroy$.next();
        this.destroy$.complete();
        this.stopTypingTimer.complete();
    }

    shouldShowAvatar(index: number): boolean {
        if (index === 0) return true;
        const current = this.messages[index];
        const prev = this.messages[index - 1];

        return current.user_id !== prev.user_id;
    }

    loadRoomMembers() {
        if (!this.roomId) return;

        this.roomService
            .getMembers(this.roomId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (members) => {
                    this.roomMembers = members;
                    console.log('Membros carregados: ', members);
                },
                error: (err) =>
                    console.error('Erro ao carregar membros: ', err),
            });
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
    }
}
