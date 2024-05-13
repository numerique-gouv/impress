import { create } from 'zustand';

import { baseApiUrl } from '@/core/conf';

import { User, getMe } from './api';

export const login = () => {
  window.location.replace(new URL('authenticate/', baseApiUrl()).href);
};

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
        set({ authenticated: true, userData: data });
      })
      .catch(() => {
        // todo - implement a proper login screen to prevent automatic navigation.
        login();
      });
  },
  logout: () => {
    set(initialState);
  },
}));
