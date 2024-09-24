import { create } from 'zustand';

import { baseApiUrl } from '@/core/conf';
import {
  initializeSupportSession,
  terminateSupportSession,
} from '@/hook/useSupport';

import { User, getMe } from './api';
import { PATH_AUTH_LOCAL_STORAGE } from './conf';

interface AuthStore {
  initiated: boolean;
  authenticated: boolean;
  initAuth: () => void;
  logout: () => void;
  login: () => void;
  userData?: User;
}

const initialState = {
  initiated: false,
  authenticated: false,
  userData: undefined,
};

export const useAuthStore = create<AuthStore>((set) => ({
  initiated: initialState.initiated,
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

        initializeSupportSession(data);
        set({ authenticated: true, userData: data });
      })
      .catch(() => {})
      .finally(() => {
        set({ initiated: true });
      });
  },
  login: () => {
    // If we try to access a specific page and we are not authenticated
    // we store the path in the local storage to redirect to it after login
    if (window.location.pathname !== '/') {
      localStorage.setItem(PATH_AUTH_LOCAL_STORAGE, window.location.pathname);
    }

    window.location.replace(`${baseApiUrl()}authenticate/`);
  },
  logout: () => {
    terminateSupportSession();
    window.location.replace(`${baseApiUrl()}logout/`);
  },
}));
