import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  imports: [],
  templateUrl: './oauth-callback.component.html',
  styleUrl: './oauth-callback.component.css',
  standalone: true
})
export class OauthCallbackComponent implements OnInit{
    constructor(
        private route: ActivatedRoute,
        private authService: AuthService,
        private router: Router
    ){}

    ngOnInit(): void {
        const token = this.route.snapshot.queryParamMap.get('token')

        if(token){
            this.authService.saveToken(token)
            this.router.navigate(['/home'])
        } else{
            this.router.navigate(['/login'])
        }
    }

}
