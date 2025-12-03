import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Role, RoomMember } from '../../services/room.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CallService } from '../../services/call.service';
import { User } from '../../services/auth.service';

@Component({
    selector: 'app-room-sidebar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './room-sidebar.component.html',
    styleUrl: './room-sidebar.component.css',
})
export class RoomSidebarComponent {
    @Input() members: RoomMember[] = [];
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();

    @Input() currentUserRole: Role = 'member';

    @Input() roomId: string | null = null; // Recebe o ID da sala

    @Input() currentUser: User | null = null;

    @Output() removeUser = new EventEmitter<string>();
    @Output() updateRole = new EventEmitter<{ userId: string; role: Role }>();

    constructor(private callService: CallService) {}

    trackByMember(index: number, member: RoomMember): string {
        return member.user.user_id;
    }
    // Helper para verificar se posso gerenciar este membro
    canManage(memberRole: Role): boolean {
        // dono pode gerenciar todos (exceto ele mesmo)
        if (this.currentUserRole === 'owner') return true;

        if (
            this.currentUserRole === 'admin' &&
            (memberRole === 'member' || memberRole === 'guest')
        )
            return true;

        return false;
    }

    startVideoCall(member: RoomMember) {
        if (this.roomId) {
            this.callService.startCall(
                member.user.user_id,
                member.user.username,
                this.roomId
            );
            console.log(
                'Iniciando chamada de vídeo com:',
                member.user.username
            );
        } else {
            console.error('Erro: Room ID não disponível no sidebar');
        }
    }

    onRemoveUser(userId: string) {
        this.removeUser.emit(userId);
    }

    onUpdateRole(userId: string, role: string) {
        this.updateRole.emit({ userId, role: role as Role });
    }
}
