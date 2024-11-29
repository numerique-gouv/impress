export const backendUrl = () =>
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export const baseApiUrl = (apiVersion: string = '1.0') =>
  `${backendUrl()}/api/v${apiVersion}/`;
