import { Component, OnInit } from '@angular/core';
import { Room, RoomService } from '../../services/room.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CreateRoomModalComponent } from '../../components/create-room-modal/create-room-modal.component';
import { RoomCardComponent } from '../../components/room-card/room-card.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    CreateRoomModalComponent,
    RoomCardComponent,
  ]
})
export class HomeComponent implements OnInit {
  ownedRooms: Room[] = [];
  joinedRooms: Room[] = [];
  showCreateModal = false;
  loading = false;

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms() {
    this.loading = true;
    
    this.roomService.getOwnedRooms().subscribe({
      next: rooms => {
        this.ownedRooms = rooms;
        this.loading = false;
      },
      error: err => {
        console.error('Erro ao carregar salas criadas:', err);
        this.loading = false;
      }
    });

    this.roomService.getJoinedRooms().subscribe({
      next: rooms => {
        this.joinedRooms = rooms;
        this.loading = false;
      },
      error: err => {
        console.error('Erro ao carregar salas que participa:', err);
        this.loading = false;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }

  onCreateRoom() {
    this.showCreateModal = true;
  }

  onModalClose() {
    this.showCreateModal = false;
  }

  onRoomCreated(newRoom: Room) {
    // Em vez de adicionar manualmente, recarrega toda a lista
    this.loadRooms();
    this.showCreateModal = false;
  }
}