import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Room } from '../../services/room.service';

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-card.component.html',
  styleUrls: ['./room-card.component.css']
})
export class RoomCardComponent {
  @Input() room!: Room;
  @Input() color: 'blue' | 'green' = 'blue';

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

  

}