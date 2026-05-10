// import { Routes } from '@angular/router';
// import { Login } from './login/login';
// import { Home } from './home/home';
// import { Conversation } from './conversation/conversation';
// import { Landing } from './landing/landing';
// import { Signup } from './signup/signup';

// export const routes: Routes = [
//     {path: 'home', component: Home,
//         children:[
//             {path: 'conv/:id', component: Conversation}
//         ]
//     },
//     {path: 'login', component: Login},
//     {path: 'signup', component: Signup},
//     {path: '', component: Landing}
// ];

import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';

import { Login } from './login/login';
import { Home } from './home/home';
import { Conversation } from './conversation/conversation';
import { Landing } from './landing/landing';
import { Signup } from './signup/signup';

import { Store } from './store'; // assuming this already exists
import { environment } from '../environments/environment';
import { EventBusService } from '../app/event-bus';

// 🔐 Inline route condition function
const authCheck = async (route: any, state: any) => {
  const eventBus = inject(EventBusService);
  const router = inject(Router);
  const store = inject(Store);

  // ✅ If user already in store → trust it
  if (store.currentUser && Object.keys(store.currentUser).length) {
    if (['/login', '/signup', '/'].includes(state.url)) {
      router.navigate(['/home']);
      return false;
    }
    return true;
  }

  // 🔁 Fetch user info once
  try {
    eventBus.emit('fetchUserInfoStarted');
    const res = await fetch(`${environment.apiUrl}/auth/userInfo`, {
      method: 'GET',
      credentials: 'include'
    });

    if (res.ok) {
      eventBus.emit('fetchUserInfoEnded');
      const user = await res.json();
      store.setUser(user);

      if (['/login', '/signup', '/'].includes(state.url)) {
        router.navigate(['/home']);
        return false;
      }
      return true;
    }
  } catch (err) {
    console.error('Error fetching user info:', err);
    eventBus.emit('fetchUserInfoEnded');
  }

  // ❌ Not logged in
  if (state.url.startsWith('/home')) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};

export const routes: Routes = [
  {
    path: 'home',
    component: Home,
    canActivate: [authCheck],
    children: [
      { path: 'conv/:id', component: Conversation }
    ]
  },
  { path: 'login', component: Login, canActivate: [authCheck] },
  { path: 'signup', component: Signup, canActivate: [authCheck] },
  { path: '', component: Landing, canActivate: [authCheck] }
];

