import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomMember, RoomService } from '../../services/room.service';

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
        this.roomId = this.route.snapshot.paramMap.get('roomID')!;
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
}
