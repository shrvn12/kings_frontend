import { Component, inject } from '@angular/core';
import { Store } from '../store';
import { io, Socket } from 'socket.io-client';
import { SideNavbar } from '../side-navbar/side-navbar';
import { ChatList } from '../chat-list/chat-list';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { EventBusService } from '../event-bus';
import { user } from '../models';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-home',
  imports: [SideNavbar, ChatList, RouterOutlet, ToastModule],
  providers: [MessageService],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private router = inject(Router)
  private subscriptions = new Subscription();
  constructor(private Store: Store, private eventbus: EventBusService, private messageService: MessageService) {}

  socket!: Socket;
  user: user = {};
  recipient: user = {};
  recipientList: user[] = [];
  userList: user[] = [];
  loadingChatList: boolean = false;
  private lastStatus: 'online' | 'away' | null = null;
  private visibilityHandler = () => this.handleVisibilityChange(this.socket);

  ngOnInit(){

    fetch('https://kings-backend-a0ez.onrender.com/auth/userInfo', {
      method: "GET",
      credentials: 'include'
    }).then(async (res) => {
      let status = res.status;
      let response = await res.json();
      if (status !== 200){
        this.router.navigate(['/login']);
      } else {
        this.Store.setUser(response);
      }
    }).catch((err) => {
      console.log('error while fetching user info', err);
      this.toast('error', 'User', err.message);
      this.router.navigate(['/login']);
    })

    this.Store.loadingChatList.subscribe((loading: boolean) => {
      this.loadingChatList = loading;
    });

    this.socket = io('https://kings-backend-a0ez.onrender.com/', {
      withCredentials: true,
    });

    this.Store.user.subscribe((user: user) => {
      if (user && typeof user === 'object'){
        this.user = user;
        this.socket.emit('join', user);
      }
    });

    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.socket.on('private message', async (message) => {
      console.log(message);
        if (message) {
          // console.log('socket recieved the message', message);
          this.eventbus.emit('messageRecieved', message);
        }
    });

    this.socket.on('message-receipt', ({ messageId, clientMessageId, status, conversationId, savedMessageId }) => {
      // console.log('message-receipt recieved', { messageId, clientMessageId, status, conversationId, savedMessageId });
      this.eventbus.emit('messageReceipt', { messageId, clientMessageId, status, conversationId, savedMessageId });
    });

    this.socket.on('user-status', ({userId, state}) => {
      console.log('user-status recieved', {userId, state});
      this.eventbus.emit('userStatus', {userId, state});
    })

    this.eventbus.on('userStatusRequest', (userId: string) => {
      // console.log('userStatusRequest recieved for userId', userId);
      this.socket.emit('status:get', { userId });
    });

    const privateMessage = this.eventbus.on('privateMessage', (msg) => {
      // console.log('home', msg);
      this.socket.emit('private message', msg);
    })

    this.eventbus.on('markRead', (conversationId: string) => {
      // console.log('emitting markRead for conversationId', conversationId);
         this.socket.emit('mark-read', { conversationId }); 
    });

    this.subscriptions.add(privateMessage);
  }

  handleVisibilityChange(socket: Socket) {
    if (!socket?.connected) {
      console.log('Socket not connected, cannot emit status');
      return;
    };
    if (document.visibilityState === 'visible') {
      this.emitOnline(socket);
    } else {
      this.emitAway(socket);
    }
  }

  emitOnline(socket: Socket) {
    if (this.lastStatus === 'online') return;

    this.lastStatus = 'online';
    socket.emit('status:update', { state: 'online' });
  }

  emitAway(socket: Socket) {
    if (this.lastStatus === 'away') return;

    this.lastStatus = 'away';
    socket.emit('status:update', { state: 'away' });
  }

  joinChat() {
    if (this.user) {
        this.socket.emit('join', this.user);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe(); // Unsubscribes from all
  }

  toast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail, life: 3000 });
  }

  async findUserById(id: string){
    return await fetch(`https://kings-backend-a0ez.onrender.com/user/${id}`, {
      credentials: 'include'
    }).then(async (res) => {
      let response = await res.json();
      return response;
    }).catch((error) => {
      console.log('error while searching user', error);
      return null;
    })
  }

}
