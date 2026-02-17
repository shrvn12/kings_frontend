import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '../store';
import { EventBusService } from '../event-bus';
import { Subscription } from 'rxjs';
import { user } from '../models';
import { environment } from '../../environments/environment';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface message {
  _id?: string | object,
  conversationId: string,
  senderId: string | object | undefined,
  clientMessageId?: string,
  text: string,
  status: string,
  type: string,
  createdAt?: Date,
  updatedAt?: Date,
  deletedAt?: Date | null
}

@Component({
  selector: 'app-conversation',
  imports: [FormsModule, CommonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './conversation.html',
  styleUrl: './conversation.css'
})

export class Conversation {
  private route = inject(ActivatedRoute);
  private subscriptions = new Subscription();

  constructor(private Store: Store,
    private eventbus: EventBusService,
    private messageService: MessageService
  ) { }
  @ViewChild('chatContainer') chatContainer!: ElementRef<HTMLDivElement>;
  message = '';
  user: user = {};
  recipientList: user[] = [];
  recipientDetails: user = {};
  messages: message[] = [];
  loadingConversation: boolean = false;
  icon = 'pi pi-clone copyIcon'


  ngAfterViewInit() {
    this.scrollToBottom();
  }

  ngOnChanges() {
    this.scrollToBottom();
  }

  sendMessage() {
    if (this.message.trim() === '') { return; }
    let msg = {
      "conversationId": `${this.route.snapshot.paramMap.get('id')}`,
      "clientMessageId": crypto.randomUUID(),
      "senderId": this.user._id,
      "text": this.message.trim(),
      "createdAt": new Date(),
      "status": "sent",
      "type": "text",
    }

    this.messages.push(msg);
    this.scrollToBottom();
    this.eventbus.emit('privateMessage', msg);
    this.message = '';
  }

  maxLength = 500; // Adjust this value as needed
  expandedMessages = new Set<string>(); // Track expanded messages by ID

  toggleExpand(message: any): void {
      if (this.expandedMessages.has(message._id)) {
          this.expandedMessages.delete(message._id);
      } else {
          this.expandedMessages.add(message._id);
      }
  }

  isExpanded(message: any): boolean {
      return this.expandedMessages.has(message._id);
  }

  copyMessage(text: string): void {
      navigator.clipboard.writeText(text).then(() => {
          // Optional: Show a toast notification
          console.log('Message copied!');
          this.icon = 'pi pi-check copyIcon';
          this.toast('success', 'Copy!', 'Message copied to clipboard');
      }).catch(err => {
          console.error('Failed to copy message:', err);
      });
  }

  showMessageActions(index: number) {
    this.showMessageActionsIndex[index] = true;
    this.icon = 'pi pi-clone copyIcon';

  }

  showMessageActionsIndex: { [key: number]: boolean } = {};

  toggleMessageActions(index: number) {
    this.showMessageActionsIndex[index] = !this.showMessageActionsIndex[index];
  }

  ngOnInit() {

    this.route.paramMap.subscribe(params => {
      this.getMessages();
      this.recipientDetails = this.recipientList.filter((item: user) => item.conversationId == this.route.snapshot.paramMap.get('id'))[0];
      this.eventbus.emit('routeParam', this.route.snapshot.paramMap.get('id'));
    });


    this.Store.user.subscribe((user: user) => {
      this.user = user;
    })

    this.Store.recipients.subscribe((recipients: user[]) => {
      this.recipientList = recipients;
      this.recipientDetails = this.recipientList.filter((item: user) => item.conversationId == this.route.snapshot.paramMap.get('id'))[0];
    })

    const messageRecieved = this.eventbus.on('messageRecieved', (msg) => {
      if (msg.conversationId !== this.route.snapshot.paramMap.get('id')) {
        return;
      }
      this.messages.push(msg);
      this.eventbus.emit('markRead', msg.conversationId);
      this.scrollToBottom();
      // console.log('message recieved by eventbus', msg);
    })

    this.eventbus.on('messageReceipt', ({ conversationId, clientMessageId, messageId, status, savedMessageId }) => {
      const currentChatId = this.route.snapshot.paramMap.get('id');

      // Ignore receipts for other conversations
      if (conversationId && conversationId !== currentChatId) return;

      // console.log(`Processing ${status} receipt. ClientID: ${clientMessageId}, SavedID: ${savedMessageId}`);

      if (clientMessageId && savedMessageId) {
        const msg = this.messages.find(m => m.clientMessageId === clientMessageId);
        if (msg) {
          msg._id = savedMessageId;
          // console.log('Mapped clientMessageId to savedMessageId for message:', msg);
        }
      }

      const serverIds = Array.isArray(messageId) ? messageId : [messageId];

      // Update specific messages to delivered
      if (status === 'delivered') {
        this.messages.forEach(msg => {
          const isMatch = (clientMessageId && msg.clientMessageId === clientMessageId) || serverIds.includes(msg._id);

          if (isMatch) {
            msg.status = 'delivered';
          }
        });
        // console.log('Status updated to delivered');
        return;
      }

      // Bulk update sent messages to read
      if (status === 'read') {
        let updatedCount = 0;
        for (let i = this.messages.length - 1; i >= 0; i--) {
          const msg = this.messages[i];

          if (msg.senderId !== this.user._id) continue;
          if (msg.status === 'read') break;

          msg.status = 'read';
          updatedCount++;
        }
        // console.log(`Marked ${updatedCount} messages as read`);
      }
    });

    this.subscriptions.add(messageRecieved);
  }

  ngOnDestory() {
    this.subscriptions.unsubscribe();
  }

  getMessages() {
    this.loadingConversation = true;
    fetch(`${environment.apiUrl}/message/conversation/${this.route.snapshot.paramMap.get('id')}`, {
      credentials: 'include'
    }).then(async (res) => {
      let response = await res.json();
      this.messages = response;
      this.loadingConversation = false;
      if (this.messages.length && this.messages[this.messages.length - 1].conversationId == this.route.snapshot.paramMap.get('id')) {
        this.eventbus.emit('markRead', this.route.snapshot.paramMap.get('id')!);
      }
      this.scrollToBottom();
    }).catch((error) => {
      this.loadingConversation = false;
      console.log('error while fetching messages', error);
    })
  }

  scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      });
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  toast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail, life: 1500 });
  }
}
