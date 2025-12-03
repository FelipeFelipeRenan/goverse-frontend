import { Injectable } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import { ChatService, Message } from './chat.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export interface CallState {
    isCalling: boolean;
    isReceivingCall: boolean; // verificar se alguem está ligando para o usuario
    remoteUserId: string | null;
    remoteUsername: string | null;
    roomId: string | null;
}

@Injectable({
    providedIn: 'root',
})
export class CallService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;

    // streams de midia para o componente consumir
    public localStream$ = new BehaviorSubject<MediaStream | null>(null);
    public remoteStream$ = new BehaviorSubject<MediaStream | null>(null);

    // estado de chamada, para esconder modais ou mostra-los
    public callState$ = new BehaviorSubject<CallState>({
        isCalling: false,
        isReceivingCall: false,
        remoteUserId: null,
        remoteUsername: null,
        roomId: null,
    });

    // configuração do Coturn (atualmente apontando para o docker local)
    private rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:localhost:3478' },
            {
                urls: 'turn:localhost:3478',
                username: 'user',
                credential: 'password',
            },
        ],
    };
    constructor(
        private chatService: ChatService,
        private toastService: ToastService,
        private authService: AuthService
    ) {
        this.listenToSignaling();
    }

    // Escuta mensagens de sinalização vindas do websocket
    private listenToSignaling() {
        this.chatService
            .onNewMessage()
            .pipe(filter((msg) => msg.type === 'SIGNAL'))
            .subscribe(async (msg) => {
                await this.handleSignalMessage(msg);
            });
    }

    // Inicializa uma chamada (como caller)
    public async startCall(
        targetUserId: string,
        targetUsername: string,
        roomId: string
    ) {
        this.callState$.next({
            isCalling: true,
            isReceivingCall: false,
            remoteUserId: targetUserId,
            remoteUsername: targetUsername,
            roomId: roomId,
        });

        await this.initPeerConnection(targetUserId, roomId);

        // Cria a oferta SDP
        const offer = await this.peerConnection!.createOffer();
        await this.peerConnection!.setLocalDescription(offer);

        this.sendSignal('offer', offer, targetUserId, roomId);
    }

    // aceita uma chamada (como callee)
    public async answerCall() {
        const state = this.callState$.value;
        if (!state.remoteUserId) return;

        // o peerconnection ja foi criado quando recebeu o offer no handleSignalMessage
        // agora precisamos ter acesso a camera e responder
        await this.getUserMedia();

        this.localStream!.getTracks().forEach((track) => {
            this.peerConnection!.addTrack(track, this.localStream!);
        });

        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);
    }

    // encerrar chamada
    public endCall() {
        if (this.localStream) {
            this.localStream.getTracks().forEach((t) => t.stop());
            this.localStream = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.localStream$.next(null);
        this.remoteStream$.next(null);
        this.callState$.next({
            isCalling: false,
            isReceivingCall: false,
            remoteUserId: null,
            remoteUsername: null,
            roomId: null,
        });
    }

    // logica interna do webrtc

    private async handleSignalMessage(msg: Message) {
        const data = JSON.parse(msg.content); // {type: 'offer}, payload: ...}
        const senderId = msg.user_id;

        if (!this.peerConnection && data.type === 'offer') {
            // ligação recebida
            this.callState$.next({
                isCalling: false, // ainda nao atendida
                isReceivingCall: true, // mostra modal de atender chamada
                remoteUserId: senderId,
                remoteUsername: msg.username,
                roomId: msg.room_id,
            });

            // inicializa conexão passiva
            await this.initPeerConnection(senderId, msg.room_id);
            await this.peerConnection!.setRemoteDescription(
                new RTCSessionDescription(data.payload)
            );
        } else if (this.peerConnection) {
            if (data.type === 'answer') {
                await this.peerConnection.setRemoteDescription(
                    new RTCSessionDescription(data.payload)
                );
            } else if (data.type === 'candidate') {
                if (data.payload) {
                    await this.peerConnection.addIceCandidate(
                        new RTCIceCandidate(data.payload)
                    );
                }
            }
        }
    }

    // chamado quando o usuario clica em "Atender" na ui
    public async confirmAnswer() {
        const state = this.callState$.value;

        // O roomId já deve estar no estado (salvo quando recebemos o offer)
        if (!state.remoteUserId || !state.roomId || !this.peerConnection) {
            console.error('Dados da chamada incompletos para atender');
            return;
        }

        this.callState$.next({
            ...state,
            isCalling: true,
            isReceivingCall: false,
        });

        try {
            await this.getUserMedia();
            this.localStream!.getTracks().forEach((track) => {
                this.peerConnection!.addTrack(track, this.localStream!);
            });

            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            // Usa o roomId salvo no estado
            this.sendSignal('answer', answer, state.remoteUserId, state.roomId);
        } catch (error) {
            console.error('Erro ao atender:', error);
            this.endCall();
        }
    }
    private async initPeerConnection(targetUserId: string, roomId: string) {
        this.peerConnection = new RTCPeerConnection(this.rtcConfig);

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal(
                    'candidate',
                    event.candidate,
                    targetUserId,
                    roomId
                );
            }
        };

        this.peerConnection.ontrack = (event) => {
            console.log('Stream remoto recebido');
            this.remoteStream$.next(event.streams[0]);
        };

        // se for caller, pega a camera imediatamente, se for callee, espera o "Atender"
        if (
            this.callState$.value.isCalling &&
            !this.callState$.value.isReceivingCall
        ) {
            await this.getUserMedia();
            this.localStream!.getTracks().forEach((track) => {
                this.peerConnection!.addTrack(track, this.localStream!);
            });
        }
    }
    private sendSignal(
        type: string,
        payload: any,
        targetUserId: string,
        roomId: string
    ) {
        const content = JSON.stringify({ type, payload });
        this.chatService.sendMessage({
            type: 'SIGNAL',
            content: content,
            room_id: roomId,
            target_user_id: targetUserId,
        });
    }

    private async getUserMedia() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            this.localStream$.next(this.localStream);
        } catch (err) {
            console.error('Erro ao aceessa camera: ', err);
            this.toastService.error(
                'Não foi possivel acessar a camera/microfone'
            );
        }
    }
}
