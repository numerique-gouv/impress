import { create } from 'zustand';

import { User, getMe } from './api';

export const login = () => {
  window.location.replace(
    new URL('authenticate/', process.env.NEXT_PUBLIC_API_URL).href,
  );
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
