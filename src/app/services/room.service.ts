import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// room.service.ts
export interface Room {
    room_id: string;
    room_name: string;  // Alterado de 'name' para 'room_name'
    room_description: string;  // Alterado de 'description' para 'room_description'
    is_public: boolean;
    owner_id: string;
    member_count: number;
    max_members: number;
    created_at: string;
    updated_at: string;
}

export interface CreateRoomPayload {
    name: string;
    description: string;
    max_members: number;
    is_public: boolean;
}


export interface UpdateRoomPayload {
    name?: string;
    description?: string;
    max_members?: number;
    is_public?: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class RoomService {
    private baseUrl = 'http://localhost:8088';

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

    deleteRoom(roomId: string): Observable<void>{
        return this.http.delete<void>(`${this.baseUrl}/rooms/${roomId}`)
    }

updateRoom(roomId: string, updates: Partial<{
    name: string;
    description: string;
    is_public: boolean;
    max_members: number;
}>): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/rooms/${roomId}`, updates, {
        headers: { 'Accept': 'application/json' }
    });
}
}
