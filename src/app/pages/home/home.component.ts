import { Component, OnInit } from '@angular/core';
import { Room, RoomService } from '../../services/room.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [
    CommonModule,
  ]
})
export class HomeComponent implements OnInit {
  ownedRooms: Room[] = [];
  joinedRooms: Room[] = [];

  constructor(private roomService: RoomService) {}

  ngOnInit(): void {
    this.roomService.getOwnedRooms().subscribe({
      next: rooms => this.ownedRooms = rooms,
      error: err => console.error('Erro ao carregar salas criadas:', err)
    });

    this.roomService.getJoinedRooms().subscribe({
      next: rooms => this.joinedRooms = rooms,
      error: err => console.error('Erro ao carregar salas que participa:', err)
    });
  }
}
