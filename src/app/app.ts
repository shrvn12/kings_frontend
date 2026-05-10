import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { EventBusService } from './event-bus';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  providers: [MessageService],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('kings');
  constructor(private eventBus: EventBusService, private messageService: MessageService) {}
  ngOnInit() {
    this.eventBus.on('fetchUserInfoStarted', () => {
      console.log('Fetching user info...&&&&&&');
      this.toast('info', 'Starting render', 'This may take upto 50 seconds');
    });
    this.eventBus.on('fetchUserInfoEnded', () => {
      console.log('Finished fetching user info.&&&&&&');
      //retract the loading toast
      // this.messageService.clear();
    });
  }

  toast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail, sticky: true });
  }
}
