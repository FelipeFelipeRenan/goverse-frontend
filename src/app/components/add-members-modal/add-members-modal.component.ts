import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role } from '../../services/room.service';

@Component({
    selector: 'app-add-members-modal',
    imports: [CommonModule, FormsModule],
    templateUrl: './add-members-modal.component.html',
    styleUrl: './add-members-modal.component.css',
    standalone: true,
})
export class AddMembersModalComponent {
    @Output() close = new EventEmitter<void>();
    @Output() add = new EventEmitter<{ email: string; role: Role }>();

    email = '';
    role: Role = 'member';

    // 'owner' fica de fora: o backend não permite atribuir (a sala tem um único dono)
    roles: Role[] = ['admin', 'moderator', 'member', 'guest'];

    submit() {
        const email = this.email.trim();
        if (!email) return;
        this.add.emit({ email, role: this.role });
    }

    cancel() {
        this.close.emit();
    }

    closeModal() {
        this.close.emit();
    }

    getRoleLabel(role: string): string {
        const roleLabels: Record<string, string> = {
            owner: 'Dono',
            admin: 'Administrador',
            moderator: 'Moderador',
            member: 'Membro',
            guest: 'Convidado',
        };
        return roleLabels[role] || role;
    }
}
