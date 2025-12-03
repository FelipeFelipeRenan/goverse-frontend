import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { CallService, CallState } from '../../services/call.service';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.css'
})
export class VideoCallComponent implements OnInit {
  
  @ViewChild('localVideo') localVideo! : ElementRef<HTMLVideoElement>
  @ViewChild('remoteVideo') remoteVideo! : ElementRef<HTMLVideoElement>

  state$: Observable<CallState>

  constructor(public callService: CallService){
    this.state$ = this.callService.callState$
  }

  ngOnInit(): void {
    // inscrever-se nos streams para atualizar os de video
    this.callService.localStream$.subscribe(stream => {
      if (this.localVideo && stream) {
        this.localVideo.nativeElement.srcObject = stream
      }
    })

    this.callService.remoteStream$.subscribe(stream => {
      if (this.remoteVideo && stream) {
        this.remoteVideo.nativeElement.srcObject = stream
      }
    })
  }

  acceptCall(){

    // TODO: Trocar pelo dinamico
    this.callService.confirmAnswer()
  }

  hangup(){
    this.callService.endCall()
  }
}
