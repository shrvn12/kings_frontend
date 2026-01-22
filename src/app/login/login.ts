import { Component, inject } from '@angular/core';
import { Store } from '../store';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private router = inject(Router)
  constructor(private Store: Store, private messageService: MessageService){}

  severity: {[key: number]: string} = {
    200: 'success',         // OK
    201: 'success',         // Created
    202: 'success',         // Accepted
    204: 'info',            // No Content

    400: 'error',           // Bad Request
    401: 'error',           // Unauthorized
    403: 'error',           // Forbidden
    404: 'error',           // Not Found
    409: 'warning',         // Conflict
    422: 'error',           // Unprocessable Entity

    500: 'error',           // Internal Server Error
    502: 'error',           // Bad Gateway
    503: 'error',           // Service Unavailable
    504: 'error'            // Gateway Timeout
  };


  userName="";
  password="";
  loggingIn : boolean = false;
  setUser(event: SubmitEvent){
    event.preventDefault();
    this.loggingIn = true;
    fetch(`${environment.apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        userName: this.userName.toLocaleLowerCase(),
        password: this.password
      }),
      credentials: 'include'
    }).then(async (res) => {
      let status = res.status;
      let response = await res.json();
      this.loggingIn = false;
      console.log(response);
      console.log(document.cookie);
      this.toast(this.severity[status], 'Login', response.msg);
      if (status == 200){
        this.router.navigate(['/home']);
      }
    }).catch((err) => {
      this.loggingIn = false;
      console.log('error while login', err);
      this.toast('error', 'Login', 'Something went wrong');
    })
  }

  toast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail, life: 3000 });
  }
}
