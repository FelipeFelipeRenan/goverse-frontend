import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Role, RoomMember, RoomService } from '../../services/room.service';
import { AddMembersModalComponent } from '../../components/add-members-modal/add-members-modal.component';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-room-members',
    standalone: true,
    imports: [CommonModule, AddMembersModalComponent],
    templateUrl: './room-members.component.html',
    styleUrl: './room-members.component.css',
})
export class RoomMembersComponent implements OnInit {
    roomId!: string;
    members: RoomMember[] = [];
    filteredMembers: RoomMember[] = [];
    isLoading = true;
    currentPage = 1;
    itemsPerPage = 10;
    totalPages = 1;
    searchQuery = '';
    
    showAddMemberModal = false

    constructor(
        private route: ActivatedRoute,
        private roomService: RoomService,
        private toastService: ToastService,
    ) {}

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            console.error('roomID não fornecido na rota');
            return;
        }
        this.roomId = id;
        this.fetchMembers();
    }

    fetchMembers() {
        this.isLoading = true;
        this.roomService.getMembers(this.roomId).subscribe({
            next: (data) => {
                this.members = data;
                this.filteredMembers = [...data];
                this.totalPages = Math.ceil(
                    this.members.length / this.itemsPerPage
                );
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Erro ao buscar membros: ', err);
                this.isLoading = false;
            },
        });
    }

    onRemove(userId: string) {
        if (!confirm('Deseja remover esse membro?')) return;
        this.roomService.removeMember(this.roomId, userId).subscribe({
            next: () => {
                this.members = this.members.filter(
                    (m) => m.user.user_id !== userId
                );
                this.filteredMembers = this.filteredMembers.filter(
                    (m) => m.user.user_id !== userId
                );
                this.updatePagination();
            },
            error: (err) => {
                this.toastService.error('Erro ao remover membro');
                console.error('Erro ao remover membro: ', err);
            },
        });
    }

    onChangeRole(event: Event, userId: string) {
        const select = event.target as HTMLSelectElement;
        const newRole = select.value as Role;

        this.roomService
            .updateMemberRole(this.roomId, userId, newRole)
            .subscribe({
                next: () => {
                    const member = this.members.find(
                        (m) => m.user.user_id === userId
                    );
                    if (member) member.role = newRole;

                    const filteredMember = this.filteredMembers.find(
                        (m) => m.user.user_id === userId
                    );
                    if (filteredMember) filteredMember.role = newRole;
                },
                error: (err) => {
                    console.error('Erro ao atualizar role:', err);
                    // Reverte a seleção no UI
                    select.value =
                        this.members.find((m) => m.user.user_id === userId)
                            ?.role || 'member';
                    this.toastService.error('Não foi possível atualizar a função do membro.');
                },
            });
    }

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchQuery = input.value.toLowerCase();

        if (!this.searchQuery) {
            this.filteredMembers = [...this.members];
        } else {
            this.filteredMembers = this.members.filter(
                (member) =>
                    member.user.username.toLowerCase().includes(this.searchQuery) ||
                    member.user.email.toLowerCase().includes(this.searchQuery)
            ); // Faltava este parêntese de fechamento
        }

        this.currentPage = 1;
        this.updatePagination();
    }
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    private updatePagination() {
        this.totalPages = Math.ceil(
            this.filteredMembers.length / this.itemsPerPage
        );
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        }
    }

    get paginatedMembers(): RoomMember[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredMembers.slice(
            startIndex,
            startIndex + this.itemsPerPage
        );
    }

    onAddMember(data: {user_id:string; role: Role}){
        this.roomService.addMember(this.roomId, data.user_id, data.role).subscribe({
            next: () =>{
                this.showAddMemberModal = false
                this.fetchMembers()
            },
            error: (err) =>{
                console.error('Erro ao adicionar membro: ', err)
                this.toastService.error('Erro ao adicionar membro')
            }
        })
    }
}
