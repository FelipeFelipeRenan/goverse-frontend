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
import { ChatService, ConnectionStatus, Message } from '../../services/chat.service';
import { timer, Subject, EMPTY } from 'rxjs';
import { switchMap, takeUntil, catchError, max } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { RoomSidebarComponent } from '../../components/room-sidebar/room-sidebar.component';
import { Role, RoomMember, RoomService } from '../../services/room.service';
import { ToastService } from '../../services/toast.service';
import { AutoResizeDirective } from '../../directives/auto-resize.directive';
import { VideoCallComponent } from '../../components/video-call/video-call.component';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
    selector: 'app-room',
    standalone: true,
    imports: [CommonModule, FormsModule, RoomSidebarComponent, VideoCallComponent, MarkdownComponent],
    templateUrl: './room.component.html',
    styleUrls: ['./room.component.css'],
})
export class RoomComponent implements OnInit, OnDestroy {
    @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
    @ViewChild(AutoResizeDirective) resizeDirective!: AutoResizeDirective;

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

    public isNearBottom = true;
    public connectionStatus: ConnectionStatus = 'connecting';

    public myRole: Role = 'member'

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
            this.roomService
                .getRoom(this.roomId)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (r) => (this.roomName = r.name),
                    error: () => (this.roomName = 'Sala'),
                });

            this.loadHistory(true);

            // Reconexão: o que chegou durante a queda só existe no histórico
            this.chatService.reconnected$
                .pipe(takeUntil(this.destroy$))
                .subscribe(() => {
                    this.toastService.success('Reconectado.');
                    this.loadHistory(false);
                });
            this.chatService.status$
                .pipe(takeUntil(this.destroy$))
                .subscribe((st) => {
                    this.connectionStatus = st;
                    this.cdr.detectChanges();
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

    // Carrega o histórico. Na reconexão, mescla com o que já está na tela (sem duplicar por id).
    private loadHistory(initial: boolean): void {
        if (!this.roomId) return;
        this.chatService
            .getHistory(this.roomId)
            .pipe(
                takeUntil(this.destroy$),
                catchError((err) => {
                    console.error('Erro ao carregar histórico:', err);
                    this.isLoadingHistory = false;
                    if (initial) this.router.navigate(['/home']);
                    return EMPTY;
                })
            )
            .subscribe((history) => {
                const seen = new Set(history.map((m) => m.id));
                const extra = this.messages.filter((m) => m.id && !seen.has(m.id));
                this.messages = [...history, ...extra];
                this.isLoadingHistory = false;
                this.cdr.detectChanges();
                this.scrollToBottom(initial ? 'instant' : 'smooth');
            });
    }

    // metodo para detectar se o usuario subiu a tela
    onScroll(): void {
        const element = this.myScrollContainer.nativeElement;
        const atBottom =
            element.scrollHeight - element.scrollTop <=
            element.clientHeight + 100;
        this.isNearBottom = atBottom;
    }

    scrollToBottom(
        behavior: ScrollBehavior = 'smooth',
        force: boolean = false
    ): void {
        if (force || behavior === 'instant' || this.isNearBottom) {
            setTimeout(() => {
                // Timeout para garantir que o DOM atualizou
                try {
                    if (this.myScrollContainer) {
                        this.myScrollContainer.nativeElement.scrollTo({
                            top: this.myScrollContainer.nativeElement
                                .scrollHeight,
                            behavior: behavior,
                        });
                        if (force) {
                            this.isNearBottom = true;
                        }
                    }
                } catch (err) {}
            }, 100);
        }
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
        } else if (msg.type === 'ERROR') {
            this.toastService.error(msg.content || 'Não foi possível enviar a mensagem.');
            return;
        } else if (msg.type === 'CHAT' || !msg.type) {
            if (msg.id && this.messages.some((m) => m.id === msg.id)) return;
            this.playNotificationSound()
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

        if (msg.type === 'PRESENCE') {
            this.updateMemberStatus(msg.user_id, !msg.content.includes('saiu'));
        } else if (msg.type === 'CHAT' || !msg.type) {
            this.updateMemberStatus(msg.user_id, true);
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
            if (!this.chatService.sendMessage(msg)) {
                this.toastService.error('Sem conexão com o chat. Sua mensagem não foi enviada.');
                return; // mantém o texto no campo para reenviar
            }
            this.newMessageContent = '';
            this.stopTypingTimer.next();
            this.typingUser = null;
            if (this.resizeDirective) {
                this.resizeDirective.reset();
            }
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
                    // Descobre o papel
                    const me = members.find(m => m.user.user_id === this.currentUser?.id)
                    if (me) this.myRole = me.role
                },
                error: (err) =>
                    console.error('Erro ao carregar membros: ', err),
            });
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
    }

    shouldShowDateSeparator(index: number): boolean {
        const currentMsg = this.messages[index];

        // sempre mostra a data na primeira mensagem
        if (index === 0) return true;

        const prevMsg = this.messages[index - 1];

        // se alguma mensagem nao tiver data (como pendente), nao mostra separador
        if (!currentMsg.CreatedAt || !prevMsg.CreatedAt) return false;

        const currentDate = new Date(currentMsg.CreatedAt).toDateString();
        const prevDate = new Date(prevMsg.CreatedAt).toDateString();

        // retorna true se as datas forem diferentes
        return currentDate !== prevDate;
    }

    updateMemberStatus(userId: string, isOnline: boolean) {
        const memberIndex = this.roomMembers.findIndex(
            (m) => m.user.user_id === userId
        );
        if (memberIndex !== -1) {
            this.roomMembers[memberIndex].is_online = isOnline;

            this.roomMembers = [...this.roomMembers];
        }
    }

    onRemoveMember(userId: string) {
        if (!confirm('Tem certeza que deseja remover ese membro??')) return

        if (this.roomId){
            this.roomService.removeMember(this.roomId, userId).subscribe({
                next: () =>{
                    this.toastService.success('Membro removido!!')
                    this.loadRoomMembers() // recarrega a lista
                },
                error: () => this.toastService.error('Erro ao remover membro!')
            })
        }
    }

    onUpdateRole(event: {userId: string, role: Role}){
        if (this.roomId) {
            this.roomService.updateMemberRole(this.roomId, event.userId, event.role).subscribe({
                next: () => {
                    this.toastService.success('Cargo atualizado com sucesso!')
                    this.loadRoomMembers()
                },
                error: (err) => this.toastService.fromError(err, 'Erro ao atualizar cargo')
            })
        }
    }

    playNotificationSound(){
        const audio = new Audio('assets/sounds/pop.mp3')
        audio.volume = 0.5
        audio.play().catch(() => {})
    }
}   
