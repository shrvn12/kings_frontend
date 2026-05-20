import { Routes, Router, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';

import { Login } from './login/login';
import { Home } from './home/home';
import { Conversation } from './conversation/conversation';
import { Landing } from './landing/landing';
import { Signup } from './signup/signup';

import { Store } from './store';
import { environment } from '../environments/environment';
import { EventBusService } from './event-bus';
import { EmptyState } from './empty-state/empty-state';

const PUBLIC_ROUTES = ['/', '/login', '/signup'];

// const authCheck: CanActivateFn = (_, state) => {
//   const eventBus = inject(EventBusService);
//   const router = inject(Router);
//   const store = inject(Store);

//   const isPublicRoute = PUBLIC_ROUTES.includes(state.url);
//   const isProtectedRoute = state.url.startsWith('/home');

//   const redirectToHome = () => router.createUrlTree(['/home']);
//   const redirectToLogin = () => router.createUrlTree(['/login']);

//   // Already authenticated
//   console.log('Checking authentication for route:', store.user);
//   if (store.user && "id" in store.user) {
//     return Promise.resolve(
//       isPublicRoute ? redirectToHome() : true
//     );
//   }

//   eventBus.emit('fetchUserInfoStarted');

//   return fetch(`${environment.apiUrl}/auth/userInfo`, {
//     method: 'GET',
//     credentials: 'include'
//   })
//     .then(async (res) => {
//       if (!res.ok) {
//         return isProtectedRoute
//           ? redirectToLogin()
//           : true;
//       }

//       const user = await res.json();

//       store.setUser(user);

//       return isPublicRoute
//         ? redirectToHome()
//         : true;
//     })
//     .catch((err) => {
//       console.error('Error fetching user info:', err);

//       return redirectToLogin();
//     })
//     .finally(() => {
//       eventBus.emit('fetchUserInfoEnded');
//     });
// };

const authCheck: CanActivateFn = (_, state) => {
  const eventBus = inject(EventBusService);
  const router = inject(Router);
  const store = inject(Store);

  const isPublicRoute = PUBLIC_ROUTES.includes(state.url);
  const isProtectedRoute = state.url.startsWith('/home');

  const redirectToHome = () => router.createUrlTree(['/home']);
  const redirectToLogin = () => router.createUrlTree(['/login']);

  // Already authenticated
  if ("id" in store.user) {
    return Promise.resolve(
      isPublicRoute ? redirectToHome() : true
    );
  }

  // Only show loading on first app boot
  const shouldShowLoader = !store.hasCheckedAuth;

  if (shouldShowLoader) {
    eventBus.emit('fetchUserInfoStarted');
  }

  return fetch(`${environment.apiUrl}/auth/userInfo`, {
    method: 'GET',
    credentials: 'include'
  })
    .then(async (res) => {
      store.hasCheckedAuth = true;

      if (!res.ok) {
        return isProtectedRoute
          ? redirectToLogin()
          : true;
      }

      const user = await res.json();

      store.setUser(user);

      return isPublicRoute
        ? redirectToHome()
        : true;
    })
    .catch((err) => {
      store.hasCheckedAuth = true;

      console.error('Error fetching user info:', err);

      return isProtectedRoute
        ? redirectToLogin()
        : true;
    })
    .finally(() => {
      if (shouldShowLoader) {
        eventBus.emit('fetchUserInfoEnded');
      }
    });
};

export const routes: Routes = [
  {
    path: 'home',
    component: Home,
    canActivate: [authCheck],
    children: [
      {
        path: 'conv/:id',
        component: Conversation
      },
      {
        path: '',
        component: EmptyState
      }
    ]
  },
  {
    path: 'login',
    component: Login,
    canActivate: [authCheck]
  },
  {
    path: 'signup',
    component: Signup,
    canActivate: [authCheck]
  },
  {
    path: '',
    component: Landing,
    canActivate: [authCheck]
  }
];