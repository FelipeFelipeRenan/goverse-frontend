import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room, UpdateRoomPayload } from '../../services/room.service';

@Component({
    selector: 'app-edit-room-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './edit-room-modal.component.html',
    styleUrl: './edit-room-modal.component.css',
})
export class EditRoomModalComponent implements OnChanges {
    // A home passa o objeto Room das listagens (room_name/room_description).
    @Input() room!: Partial<Room> & UpdateRoomPayload;
    @Output() close = new EventEmitter<void>();
    @Output() updated = new EventEmitter<Partial<Room>>();

    editedRoom: Partial<UpdateRoomPayload> = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['room'] && this.room) {
            this.editedRoom = {
                name: this.room.room_name ?? this.room.name,
                description: this.room.room_description ?? this.room.description,
                is_public: this.room.is_public,
                max_members: this.room.max_members,
            };
        }
    }

    submit() {
        this.updated.emit(this.editedRoom);
        this.close.emit(); // fecha o modal após atualizar
    }

    cancel() {
        this.close.emit();
    }
}
