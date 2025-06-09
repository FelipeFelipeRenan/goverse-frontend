import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  rooms = [
        { id: 'abc123', name: 'Estudo de Algoritmos', online: 3 },
    { id: 'xyz789', name: 'Grupo de GoLang', online: 1 },
  ];

  constructor(){}
}
