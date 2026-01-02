import { Component, inject } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '../store';
import { ActivatedRoute, Router } from '@angular/router';
import { user } from '../models';
import { debounceTime, Subject } from 'rxjs';
import { EventBusService } from '../event-bus';

@Component({
  selector: 'app-chat-list',
  imports: [CommonModule, InputTextModule, FormsModule],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.css'
})

export class ChatList {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  constructor(private Store: Store, private eventbus: EventBusService) { }
  private searchSubject = new Subject<string>();
  searchQuery = "";
  user: user = {};
  users: user[] = [];
  conversations: any[] = [];
  filteredUsers: user[] = [];
  searchResults: user[] = [];
  selectedUserId: string | null = null;
  onlineUsers: Object = {};
  filterUsers() {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredUsers = this.users.filter(user => user.name?.toLowerCase().includes(query) || user.userName?.toLowerCase().includes(query));
    this.searchSubject.next(this.searchQuery);
  }
  ngOnInit() {

    this.Store.user.subscribe((user: user) => {
      this.user = user;
    })

    this.eventbus.on('routeParam', (param: string) => {
      this.selectedUserId = param;
      console.log('selectedUserId updated to', this.selectedUserId);
    });

    this.listConv();

    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(query => {
      this.searchUsers(query);
    });

    this.eventbus.on('userStatus', ({ userId, state }: { userId: string, state: 'online' | 'away' | 'offline' }) => {
      this.onlineUsers = {
        ...this.onlineUsers,
        [userId]: state
      };
    });

    this.eventbus.on('messageRecieved', (message: any) => {
      for (let conv of this.conversations) {
        if (conv.conversationId === message.conversationId) {
          conv.lastMessage = message;
        }
      }
    });

    this.eventbus.on('private-message', (message: any) => {
      console.log('private-message event received in ChatList', message);
      for (let conv of this.conversations) {
        if (conv.conversationId === message.conversationId) {
          conv.lastMessage = message;
        }
      }
    });

    this.eventbus.on('markRead', (conversationId: string) => {
      for (let conv of this.conversations) {
        if (conv.conversationId === conversationId) {
          if (conv.lastMessage){
            conv.lastMessage.status = 'read';
          }
        }
      }
    });
  }

  conv(user: user) {
    if (user && '_id' in user && typeof user._id == 'string') {
      if (!user.conversationId) {
        fetch(`https://kings-backend-a0ez.onrender.com/conv/create`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({ participants: [user._id] })
        }).then(async (res) => {
          let ok = res.ok;
          let response = await res.json();
          if (ok && response.conversation._id) {
            user.conversationId = response.conversation._id;
            await this.listConv();
            this.router.navigate([`/home/conv/${user.conversationId}`]);
          } else {
            console.error('Error creating conversation:', response);
          }
        }).catch((error) => {
          console.error('Error while creating conversation:', error);
        })
      } else {
        this.router.navigate([`/home/conv/${user.conversationId}`]);
        this.eventbus.emit('markRead', user.conversationId!);
      }
    }
  }

  async listConv() {
    this.Store.setLoadingChatList(true);
    await fetch('https://kings-backend-a0ez.onrender.com/conv/list', {
      credentials: 'include'
    }).then(async (res) => {
      let response = await res.json();
      let users = [];
      for (let conv of response) {
        conv.user.conversationId = conv.conversationId;
        this.eventbus.emit('userStatusRequest', conv.user._id);
        users.push(conv.user);
      }
      this.Store.setRecipients(users);
      this.Store.setLoadingChatList(false);
      this.users = users;
      // this.filteredUsers = response.users;
      this.conversations = response;
    }).catch((error) => {
      this.Store.setLoadingChatList(false);
      console.log('error while fetching conv list', error);
    })
  }

  searchUsers(query: string) {
    if (!query || !query.length) {
      this.searchResults = [];
      return;
    }

    fetch(`https://kings-backend-a0ez.onrender.com/user/search?userName=${query}`, {
      credentials: 'include'
    }).then(async (res) => {
      let response = await res.json();
      console.log(response);
      this.searchResults = [];
      if (response) {
        if (!this.users.find((item) => item.userName == response.userName) && this.user.userName !== response.userName) {
          this.searchResults.push(response);
        };
      }
    }).catch((error) => {
      console.log('error while searching user', error);
    })
  }
}
