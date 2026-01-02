import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { user } from './models';

@Injectable({
  providedIn: 'root'
})
export class Store {
  private messageSource = new BehaviorSubject<string>('Hello');
  private userSource = new BehaviorSubject<Object>({});
  private userListSource = new BehaviorSubject<user []>([]);
  private recipientsSource = new BehaviorSubject<user []>([]);
  private recipientSource = new BehaviorSubject<user>({});
  private loadingChatListSource = new BehaviorSubject<boolean>(false);

  currentMessage = this.messageSource.asObservable();
  user = this.userSource.asObservable();
  userList = this.userListSource.asObservable();
  recipients = this.recipientsSource.asObservable();
  recipient = this.recipientSource.asObservable();

  loadingChatList = this.loadingChatListSource.asObservable();

  changeMessage(message: string) {
    this.messageSource.next(message);
  }
  setUser(user: user){
    this.userSource.next(user);
  }
  currentUser() {
    return this.userSource.value;
  }
  setRecipient(user: user){
    this.recipientSource.next(user);
  }
  updateUserList(list: user []){
    this.userListSource.next(list);
  }
  setRecipients(users: user[]){
    this.recipientsSource.next(users);
  }
  setLoadingChatList(loading: boolean){
    this.loadingChatListSource.next(loading);
  }
}
