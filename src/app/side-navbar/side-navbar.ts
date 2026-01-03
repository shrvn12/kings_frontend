import { Component, inject } from '@angular/core';
import { Store } from '../store';
import { user } from '../models';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { EventBusService } from '../event-bus';
import { environment } from '../../environments/environment.development';

@Component({
  selector: 'app-side-navbar',
  imports: [ ToastModule],
  providers: [MessageService],
  templateUrl: './side-navbar.html',
  styleUrl: './side-navbar.css'
})
export class SideNavbar {
  private router = inject(Router)
  constructor(private Store: Store, private messageService: MessageService, private eventbus: EventBusService){}
  user: user = {};
  showLogoutModal: boolean = false;

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

  ngOnInit(){
    this.Store.user.subscribe(uname => {
      this.user = uname // Will get updated values live
    });
  }

  logout() {
    fetch(`${environment.apiUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).then(async (res) => {
      let status = res.status;
      this.eventbus.emit('disconnectSocket', null);
      this.toast(this.severity[status], 'Logout', 'You have been logged out successfully.');
      if (status === 200) {
        this.showLogoutModal = false;
        this.router.navigate(['/login']);
      }
    });
  }

  toast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail, life: 3000 });
  }
}
