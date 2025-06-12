import { Component, OnInit } from '@angular/core';
import { Room, RoomService } from '../../services/room.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CreateRoomModalComponent } from '../../components/create-room-modal/create-room-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [
    CommonModule,CreateRoomModalComponent
  ]
})
export class HomeComponent implements OnInit {
  ownedRooms: Room[] = [];
  joinedRooms: Room[] = [];

  showCreateModal = false;

  constructor(private roomService: RoomService, private authService: AuthService, private router: Router) {}

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


  logout() {
    this.authService.logout();
    this.router.navigate(["/login"])
  }

  onCreateRoom(){
    this.showCreateModal = true;
  }

  onModalClose(){
    this.showCreateModal = false;
  }

  onRoomCreated(data: any){
    // chama api de criação de salas
    this.roomService.createRoom(data).subscribe({
        next: (room) => {
            this.ownedRooms.push(room);
            this.showCreateModal = false;
        },
        error : (err) => {
            console.error('Erro ao criar sala', err)
        }
    })
  }

}
