import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Room {
    room_id: string;
    room_name: string;
    room_description: string;
    is_public: boolean;
    owner_id: string;
    member_count: number;
    max_members: number;
    created_at: string;
    updated_at: string;
}

export interface CreateRoomPayload {
    room_name: string;
    room_description: string;
    max_members: number;
    is_public: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class RoomService {
    private baseUrl = 'http://localhost:8088'; // API Gateway

    constructor(private http: HttpClient) {}

    getOwnedRooms(): Observable<Room[]> {
        return this.http.get<Room[]>(`${this.baseUrl}/rooms/mine`);
    }

    getJoinedRooms(): Observable<Room[]> {
        return this.http.get<Room[]>(`${this.baseUrl}/user/rooms`);
    }

    createRoom(roomData: CreateRoomPayload): Observable<Room> {
        return this.http.post<Room>(`${this.baseUrl}/rooms`, roomData);
    }
}
