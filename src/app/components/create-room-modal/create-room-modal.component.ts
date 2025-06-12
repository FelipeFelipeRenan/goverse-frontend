import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { RoomService } from '../../services/room.service'; // ✅ importe o serviço

@Component({
    selector: 'app-create-room-modal',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './create-room-modal.component.html',
    styleUrl: './create-room-modal.component.css',
})
export class CreateRoomModalComponent {
    @Output() close = new EventEmitter<void>();
    @Output() roomCreated = new EventEmitter<any>();

    roomForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private roomService: RoomService // ✅ injeção do serviço
    ) {
        this.roomForm = this.fb.group({
            room_name: ['', Validators.required],
            room_description: [''],
            max_members: [10, [Validators.required, Validators.min(2)]],
            is_public: [true],
        });
    }

    onSubmit() {
        if (this.roomForm.invalid) return;

        const formValue = this.roomForm.value;

        const payload = {
            room_name: formValue.room_name,
            room_description: formValue.room_description,
            is_public: formValue.is_public,
            max_members: formValue.max_members,
        };

        this.roomService.createRoom(payload).subscribe({
            next: (room) => {
                this.roomCreated.emit(room);
                this.close.emit();
            },
            error: (err) => {
                console.error('Erro ao criar sala:', err);
            },
        });
    }

    onCancel() {
        this.close.emit(); // ✅ idem
    }
}
