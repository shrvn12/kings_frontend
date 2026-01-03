import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from "@angular/router";
import { ToastModule } from 'primeng/toast';
import { Store } from '../store';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink, ToastModule],
  providers: [MessageService],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  private router = inject(Router)
  constructor(private Store: Store, private messageService: MessageService) { }
  fullName: string = '';
  userName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  signingUp: boolean = false;

  severity: { [key: number]: string } = {
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

  createUser(event: SubmitEvent) {
    event.preventDefault();
    this.signingUp = true;
    fetch(`${environment.apiUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        userName: this.userName,
        password: this.password,
        name: this.fullName,
        email: this.email
      }),
      credentials: 'include'
    }).then(async (res) => {
      let status = res.status;
      let response = await res.json();
      this.signingUp = false;
      console.log(response);
      this.toast(this.severity[status], 'Signup', response.msg);
      if (status == 200) {
        this.router.navigate(['/login']);
      }
    }).catch((err) => {
      this.signingUp = false;
      console.log('error while singnup', err);
      this.toast('error', 'Signup', 'Something went wrong');
    })
  }

  setUser(event: SubmitEvent) {
    event.preventDefault();
    fetch(`${environment.apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        userName: this.userName,
        password: this.password
      }),
      credentials: 'include'
    }).then(async (res) => {
      let status = res.status;
      let response = await res.json();
      console.log(response);
      console.log(document.cookie);
      this.toast(this.severity[status], 'Login', response.msg);
      if (status == 200) {
        this.router.navigate(['/home']);
      }
    }).catch((err) => {
      console.log('error while login', err);
      this.toast('error', 'Login', 'Something went wrong');
    })
  }

  toast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail, life: 3000 });
  }
}