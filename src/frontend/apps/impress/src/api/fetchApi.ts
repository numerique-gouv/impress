import { login, useAuthStore } from '@/core/auth';

/**
 * Retrieves the CSRF token from the document's cookies.
 *
 * @returns {string|null} The CSRF token if found in the cookies, or null if not present.
 */
function getCSRFToken() {
  return document.cookie
    .split(';')
    .filter((cookie) => cookie.trim().startsWith('csrftoken='))
    .map((cookie) => cookie.split('=')[1])
    .pop();
}

export const fetchAPI = async (input: string, init?: RequestInit) => {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}${input}`;
  const { logout } = useAuthStore.getState();

  const csrfToken = getCSRFToken();

  const response = await fetch(apiUrl, {
    ...init,
    credentials: 'include',
    headers: {
      ...init?.headers,
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
    },
  });

  // todo - handle 401, redirect to login screen
  // todo - please have a look to this documentation page https://mozilla-django-oidc.readthedocs.io/en/stable/xhr.html
  if (response.status === 401) {
    logout();
    // Fix - force re-logging the user, will be refactored
    login();
  }

  return response;
};
