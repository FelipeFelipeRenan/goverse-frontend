import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Role, RoomMember, RoomService } from '../../services/room.service';

@Component({
    selector: 'app-room-members',
    imports: [CommonModule],
    templateUrl: './room-members.component.html',
    styleUrl: './room-members.component.css',
})
export class RoomMembersComponent implements OnInit {
    roomId!: string;
    members: RoomMember[] = [];
    isLoading = true;

    constructor(
        private route: ActivatedRoute,
        private roomService: RoomService
    ) {}

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('roomID');
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
            },
            error: (err) => {
                alert('Erro ao remover membro');
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
                },
                error: (err) => {
                    console.error('Erro ao atualizar role:', err);
                    alert('Não foi possível atualizar a função do membro.');
                },
            });
    }
}
