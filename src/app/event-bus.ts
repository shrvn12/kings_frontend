// event-bus.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

interface EventData {
  name: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private eventSubject = new Subject<EventData>();

  emit(eventName: string, payload?: any) {
    this.eventSubject.next({ name: eventName, payload });
  }

  on(eventName: string, handler: (payload: any) => void) {
    return this.eventSubject
      .asObservable()
      .subscribe(({ name, payload }) => {
        if (name === eventName) {
          handler(payload);
        }
      });
  }
}
