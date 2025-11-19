import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RoomMember } from '../../services/room.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-room-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-sidebar.component.html',
  styleUrl: './room-sidebar.component.css'
})
export class RoomSidebarComponent {

  @Input() members: RoomMember[] = [];
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
}
