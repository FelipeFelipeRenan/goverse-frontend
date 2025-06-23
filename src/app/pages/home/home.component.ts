import { Component, OnInit } from '@angular/core';
import { Room, RoomService } from '../../services/room.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CreateRoomModalComponent } from '../../components/create-room-modal/create-room-modal.component';
import { RoomCardComponent } from '../../components/room-card/room-card.component';
import { EditRoomModalComponent } from '../../components/edit-room-modal/edit-room-modal.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        CreateRoomModalComponent,
        RoomCardComponent,
        EditRoomModalComponent,
    ],
})
export class HomeComponent implements OnInit {
    ownedRooms: Room[] = [];
    joinedRooms: Room[] = [];
    showCreateModal = false;
    loading = false;
    editedRoomId: string | null = null;
    roomBeingEdited: Room | null = null;

    constructor(
        private roomService: RoomService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadRooms();
    }

    loadRooms(): void {
        this.loading = true;

        this.roomService.getOwnedRooms().subscribe({
            next: (rooms) => {
                this.ownedRooms = rooms;
                this.loading = false;
            },
            error: (err) => {
                console.error('Erro ao carregar salas criadas:', err);
                this.loading = false;
            },
        });

        this.roomService.getJoinedRooms().subscribe({
            next: (rooms) => {
                this.joinedRooms = rooms;
            },
            error: (err) => {
                console.error('Erro ao carregar salas que participa:', err);
            },
        });
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    onCreateRoom(): void {
        this.showCreateModal = true;
    }

    onModalClose(): void {
        this.showCreateModal = false;
    }

    onRoomCreated(newRoom: Room): void {
        // Atualiza a lista completa após criação
        this.loadRooms();
        this.showCreateModal = false;
    }

    onDeleteRoom(roomId: string): void {
        if (!roomId || !confirm('Deseja realmente excluir esta sala?')) return;

        this.roomService.deleteRoom(roomId).subscribe({
            next: () => {
                this.ownedRooms = this.ownedRooms.filter(
                    (room) => room.room_id !== roomId
                );
                alert('Sala excluída com sucesso!');
            },
            error: (err) => {
                console.error('Erro ao excluir sala:', err);
                alert('Erro ao excluir sala.');
            },
        });
    }

    onEditRoom(room: Room) {
        this.editedRoomId = room.room_id;
        this.roomBeingEdited = { ...room };;
          console.log('Setando roomBeingEdited:', this.roomBeingEdited); // debug

    }

    onUpdateRoom(updates: Partial<Room>) {
        if (!this.editedRoomId) return;

        this.roomService.updateRoom(this.editedRoomId, updates).subscribe({
            next: () => {
                alert('Sala atualizada com sucesso!');
                this.editedRoomId = null;
                this.roomBeingEdited = null;
                this.loadRooms();
            },
            error: (err) => {
                console.error('Erro ao atualizar sala:', err);
                alert('Erro ao atualizar sala');
            },
        });
    }

    onEditModalClose() {
        this.editedRoomId = null;
        this.roomBeingEdited = null;
    }

    toProfilePage(){
        this.router.navigate(['/profile'])
    }
}
