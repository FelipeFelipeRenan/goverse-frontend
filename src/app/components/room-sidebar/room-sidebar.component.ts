import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Role, RoomMember } from '../../services/room.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

    @Output() removeUser = new EventEmitter<string>();
    @Output() updateRole = new EventEmitter<{ userId: string; role: Role }>();

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
}
