import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Room{
  room_id: string;
  room_name: string;
  room_description: string;
  is_public: boolean;
  owner_id: string;
  member_count:number ;
  max_members: number;
  created_at: string;
  updated_at: string;
}


@Injectable({
  providedIn: 'root'
})
export class RoomService {

  private API_URL = 'http://localhost:8088'

  constructor(private http: HttpClient) { }

  getOwnedRooms(): Observable<Room[]>{
    return this.http.get<Room[]>(`${this.API_URL}/rooms/mine`);
  }

  getJoinedRooms(): Observable<Room[]>{
    return this.http.get<Room[]>(`${this.API_URL}/user/rooms`)
  }
}
