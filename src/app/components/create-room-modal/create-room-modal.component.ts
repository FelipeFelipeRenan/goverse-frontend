import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-room-modal',
  imports: [],
  templateUrl: './create-room-modal.component.html',
  styleUrl: './create-room-modal.component.css'
})
export class CreateRoomModalComponent {

    @Output() close = new EventEmitter<void>();
    @Output() roomCreated = new EventEmitter<any>();

    roomForm: FormGroup;

    constructor(private fb: FormBuilder){
        this.roomForm = this.fb.group({
            room_name: ['', Validators.required],
            room_description: [''],
            max_members: [10,[Validators.required, Validators.min(2)]],
            is_public: [true]
        });
    }

    onSubmit(){
        if(this.roomForm.valid){
            this.roomCreated.emit(this.roomForm.value);
            this.close.emit();
        }
    }

    onCancel(){
        this.close.emit();
    }
}
