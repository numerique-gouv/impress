import { baseApiUrl, useAuthStore } from '@/core';

import { getCSRFToken } from './utils';

interface FetchAPIInit extends RequestInit {
  withoutContentType?: boolean;
}

export const fetchAPI = async (
  input: string,
  init?: FetchAPIInit,
  apiVersion = '1.0',
) => {
  const apiUrl = `${baseApiUrl(apiVersion)}${input}`;
  const csrfToken = getCSRFToken();

  const headers = {
    'Content-Type': 'application/json',
    ...init?.headers,
    ...(csrfToken && { 'X-CSRFToken': csrfToken }),
  };

  if (init?.withoutContentType) {
    delete headers?.['Content-Type' as keyof typeof headers];
  }

  const response = await fetch(apiUrl, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (response.status === 401) {
    const { logout } = useAuthStore.getState();
    logout();
  }

  return response;
};
