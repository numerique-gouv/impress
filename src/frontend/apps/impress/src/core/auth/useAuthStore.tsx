import { create } from 'zustand';

import { baseApiUrl } from '@/core/conf';

import { User, getMe } from './api';
import { PATH_AUTH_LOCAL_STORAGE } from './conf';

import { Client, PublicUserIdentity } from '@socialgouv/e2esdk-client';

export const e2esdkClient = new Client({
  // Point it to where your server is listening
  serverURL: "https://app-a5a1b445-32e0-4cf4-a478-821a48f86ccf.cleverapps.io",
  // Pass the signature public key you configured for the server
  serverSignaturePublicKey: "ayfva9SUh0mfgmifUtxcdLp4HriHJiqefEKnvYgY4qM",
});

interface AuthStore {
  initiated: boolean;
  authenticated: boolean;
  readyForEncryption: boolean;
  initAuth: () => void;
  logout: () => void;
  login: () => void;
  endToEndData?: PublicUserIdentity;
  userData?: User;
}

const initialState = {
  initiated: false,
  authenticated: false,
  readyForEncryption: false,
  userData: undefined,
};

export const useAuthStore = create<AuthStore>((set) => ({
  initiated: initialState.initiated,
  authenticated: initialState.authenticated,
  userData: initialState.userData,
  readyForEncryption: initialState.readyForEncryption,

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
        return e2esdkClient.signup(data.sub);
      }, () => {})
      .then(() => {
        set({ readyForEncryption: true });
        return Promise.resolve(() => {});
      }, () => {
        return e2esdkClient.login(userData.sub);
      })
      .then((publicIdentity: PublicUserIdentity | null) => {
        if (!publicIdentity) throw Error("exploding");

        set({endToEndData: publicIdentity});
      })
      .catch(() => {
      })
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
    window.location.replace(`${baseApiUrl()}logout/`);
  },
}));
