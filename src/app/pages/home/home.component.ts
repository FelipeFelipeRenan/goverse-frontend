import { Component, OnDestroy, OnInit } from '@angular/core';
import { Room, RoomService } from '../../services/room.service';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CreateRoomModalComponent } from '../../components/create-room-modal/create-room-modal.component';
import { RoomCardComponent } from '../../components/room-card/room-card.component';
import { EditRoomModalComponent } from '../../components/edit-room-modal/edit-room-modal.component';
import { ToastService } from '../../services/toast.service';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CreateRoomModalComponent,
        RoomCardComponent,
        EditRoomModalComponent,
    ],
})
export class HomeComponent implements OnInit, OnDestroy {
    currentUser: User | null = null;
    ownedRooms: Room[] = [];
    joinedRooms: Room[] = [];

    // propriedades para filtro
    searchTerm: string = '';
    filteredOwnedRooms: Room[] = [];
    filteredJoinedRooms: Room[] = [];

    showCreateModal = false;
    loading = true;
    editedRoomId: string | null = null;
    roomBeingEdited: Room | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private roomService: RoomService,
        private authService: AuthService,
        private toastService: ToastService,
        private router: Router
    ) {}

    ngOnInit(): void {
        // inscreve para coletar dados do usuario
        this.authService.currentUser$
            .pipe(takeUntil(this.destroy$))
            .subscribe((user) => (this.currentUser = user));
        this.loadRooms();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    filterRooms() {
        const term = this.searchTerm.toLowerCase();
        this.filteredOwnedRooms = this.ownedRooms.filter((r) =>
            r.room_name.toLowerCase().includes(term)
        );
        this.filteredJoinedRooms = this.joinedRooms.filter((r) =>
            r.room_name.toLowerCase().includes(term)
        );
    }

    loadRooms(): void {
        this.loading = true;

        this.roomService
            .getOwnedRooms()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (rooms) => {
                    this.ownedRooms = rooms;
                    this.filterRooms();
                },
                error: (err) => {
                    console.error('Erro ao carregar salas criadas:', err);
                },
            });

        this.roomService
            .getJoinedRooms()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (rooms) => {
                    this.joinedRooms = rooms;
                    this.filterRooms();
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Erro ao carregar salas que participa:', err);
                    this.loading = false;
                },
            });
    }

    // felipefeliperenan/goverse-frontend/goverse-frontend-23444aa58e9649684636f17a661a1c66bbcfb82c/src/app/pages/home/home.component.ts

    logout(): void {
        this.authService.logout().subscribe({
            next: () => {
                this.router.navigate(['/login']);
            },
            error: (err) => {
                console.error('Erro ao fazer logout:', err);
                // Mesmo em caso de erro, redireciona para o login
                this.router.navigate(['/login']);
            },
        });
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
                this.ownedRooms = this.ownedRooms?.filter(
                    (room) => room.room_id !== roomId
                );
                this.filterRooms();
                this.toastService.success('Sala excluída com sucesso!');
            },
            error: (err) => {
                console.error('Erro ao excluir sala:', err);
                this.toastService.error('Erro ao excluir sala');
            },
        });
    }

    onEditRoom(room: Room) {
        this.editedRoomId = room.room_id;
        this.roomBeingEdited = { ...room };
        console.log('Setando roomBeingEdited:', this.roomBeingEdited); // debug
    }

    onUpdateRoom(updates: Partial<Room>) {
        if (!this.editedRoomId) return;

        this.roomService.updateRoom(this.editedRoomId, updates).subscribe({
            next: () => {
                this.toastService.success('Sala atualizada com sucesso!');
                this.editedRoomId = null;
                this.roomBeingEdited = null;
                this.loadRooms();
            },
            error: (err) => {
                console.error('Erro ao atualizar sala:', err);
                this.toastService.error('Erro ao atualizar sala');
            },
        });
    }

    onEditModalClose() {
        this.editedRoomId = null;
        this.roomBeingEdited = null;
    }

    toProfilePage() {
        this.router.navigate(['/profile']);
    }
}
