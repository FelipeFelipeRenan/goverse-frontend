import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  standalone: true,
})
export class ProfileComponent implements OnInit{
    user: any = null;
    isLoading = true;
    error = '';


    constructor(
        private authService: AuthService,
        private userService: UserService,
        private router: Router
    ){}

    ngOnInit(): void {
        const userId = this.authService.getUserFromToken()?.user_id;
        if(!userId){
            console.log(userId)
            this.router.navigate(['/login'])
            return
        }

        this.userService.getUserById(userId).subscribe({
            next: (data) => {
                this.user = data;
                this.isLoading = false;
            },
            error: (err) => {
                this.error = "Erro ao carregar perfil!";
                console.error(err)
                this.isLoading = false
            }
        })

    }
    logout(){
        this.authService.logout()
        this.router.navigate(['/login'])
    }

    toHomePage(){
        this.router.navigate(['/home'])
    }
}
