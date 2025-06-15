import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Room } from '../../services/room.service';

@Component({
    selector: 'app-room-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './room-card.component.html',
    styleUrls: ['./room-card.component.css'],
})
export class RoomCardComponent {
    @Input() room!: Room;
    @Input() color: 'blue' | 'green' = 'blue';
    @Input() showActions = false;

    @Output() onDelete = new EventEmitter<string>();

    @Input() showMenu = false;

    get borderClass() {
        return this.color === 'blue'
            ? 'border-blue-100 hover:ring-blue-200'
            : 'border-green-100 hover:ring-green-200';
    }

    get bgClass() {
        return this.color === 'blue'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-green-100 text-green-700';
    }

    ngOnInit() {
        console.log('Room recebido no card:', this.room);
    }

    toggleMenu(event: MouseEvent) {
        event.stopPropagation();
        this.showMenu = !this.showMenu;
    }

    closeMenu() {
        this.showMenu = false;
    }

    editRoom() {
        alert('Editar sala: ' + this.room.room_name);
        this.closeMenu();
    }

    deleteRoom() {
        alert('Excluir sala: ' + this.room.room_id);
        console.log('Emitindo exclusão da sala com id:', this.room?.room_id);

        this.onDelete.emit(this.room.room_id);

        this.closeMenu();
    }
}
