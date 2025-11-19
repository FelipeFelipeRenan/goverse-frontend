import { Component } from '@angular/core';
import { Toast, ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone:true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {

  toasts : Toast[] = [];

  constructor(private toastService: ToastService){
    this.toastService.toasts$.subscribe(t => this.toasts = t)
  }

  close(id: number){
    this.toastService.remove(id)
  }

  getTitle(type: string): string{
    switch(type){
      case 'success': return "Sucesso";
      case 'error': return "Erro";
      default: return "Informação";
    }
  }
}
