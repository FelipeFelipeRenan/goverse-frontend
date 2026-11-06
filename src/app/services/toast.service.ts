import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private toastSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastSubject.asObservable();
  private counter = 0;
  
  
  constructor() { }

  /** Mostra a mensagem que o backend mandou ({"message": "..."}) ou um texto padrão. */
  fromError(err: any, fallback: string) {
    const msg: string | undefined = err?.error?.message;
    this.show(msg || fallback, 'error');
  }

  show(message:string , type: 'success' | 'error' | 'info' = 'info'){
    const id = this.counter++;
    const newToast: Toast = {id, type, message}

    const currentToasts = this.toastSubject.value;
    this.toastSubject.next([...currentToasts, newToast])


    // remove toas após 3 segundos
    setTimeout(() => this.remove(id), 3000)
  }

  success(message: string){
    this.show(message, 'success')
  }

  error(message: string){
    this.show(message, 'error');
  }

  remove(id: number){
    const currentToasts = this.toastSubject.value;
    this.toastSubject.next(currentToasts.filter(t => t.id !== id))
  }


}
