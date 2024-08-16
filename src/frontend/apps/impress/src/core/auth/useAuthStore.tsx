import { create } from 'zustand';

import { baseApiUrl } from '@/core/conf';

import { User, getMe } from './api';
import { PATH_AUTH_LOCAL_STORAGE } from './conf';

interface AuthStore {
  authenticated: boolean;
  initAuth: () => void;
  logout: () => void;
  userData?: User;
}

const initialState = {
  authenticated: false,
  userData: undefined,
};

export const useAuthStore = create<AuthStore>((set) => ({
  authenticated: initialState.authenticated,
  userData: initialState.userData,

  initAuth: () => {
    getMe()
      .then((data: User) => {
        // If a path is stored in the local storage, we redirect to it
        const path_auth = localStorage.getItem(PATH_AUTH_LOCAL_STORAGE);
        if (path_auth) {
          localStorage.removeItem(PATH_AUTH_LOCAL_STORAGE);
          window.location.replace(path_auth);
          return;
        }

        set({ authenticated: true, userData: data });
      })
      .catch(() => {
        // If we try to access a specific page and we are not authenticated
        // we store the path in the local storage to redirect to it after login
        if (window.location.pathname !== '/') {
          localStorage.setItem(
            PATH_AUTH_LOCAL_STORAGE,
            window.location.pathname,
          );
        }

        window.location.replace(new URL('authenticate/', baseApiUrl()).href);
      });
  },
  logout: () => {
    window.location.replace(new URL('logout/', baseApiUrl()).href);
  },
}));
