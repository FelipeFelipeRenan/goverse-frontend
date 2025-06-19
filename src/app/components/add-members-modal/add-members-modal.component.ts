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
    @Output() add = new EventEmitter<{ user_id: string; role: Role }>();

    userId = '';
    role: Role = 'member';

    roles: Role[] = ['owner', 'admin', 'moderator', 'member', 'guest']

    submit() {
        if (!this.userId.trim()) return;
        this.add.emit({ user_id: this.userId.trim(), role: this.role });
    }

    cancel() {
        this.close.emit();
    }
}
