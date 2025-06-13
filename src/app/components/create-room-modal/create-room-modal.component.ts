import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { RoomService } from '../../services/room.service';

@Component({
    selector: 'app-create-room-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './create-room-modal.component.html',
    styleUrls: ['./create-room-modal.component.css'],
})
export class CreateRoomModalComponent {
    @Output() close = new EventEmitter<void>();
    @Output() roomCreated = new EventEmitter<any>();

    roomForm: FormGroup;
    loading: boolean = false;

    constructor(
        private fb: FormBuilder,
        private roomService: RoomService
    ) {
        this.roomForm = this.fb.group({
            room_name: ['', [Validators.required, Validators.minLength(3)]],
            room_description: ['', Validators.maxLength(200)],
            max_members: [10, [Validators.required, Validators.min(2), Validators.max(100)]],
            is_public: [true],
        });
    }

    onSubmit() {
        if (this.roomForm.invalid || this.loading) {
            return;
        }

        this.loading = true;

        const formValue = this.roomForm.value;

        const payload = {
            name: formValue.room_name,
            description: formValue.room_description,
            is_public: formValue.is_public,
            max_members: formValue.max_members,
        };

        this.roomService.createRoom(payload).subscribe({
            next: (room) => {
                this.roomCreated.emit(room);
                this.loading = false;
                this.close.emit();
            },
            error: (err) => {
                console.error('Erro ao criar sala:', err);
                this.loading = false;
                if (err.status === 409) {
                    alert('Já existe uma sala com este nome!');
                } else {
                    alert('Erro ao criar sala. Tente novamente.');
                }
            },
        });
    }

    onCancel() {
        this.close.emit();
    }
}