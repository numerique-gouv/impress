export const backendUrl = () =>
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export const baseApiUrl = (apiVersion: string = '1.0') =>
  `${backendUrl()}/api/v${apiVersion}/`;

export const providerUrl = (docId: string) => {
  const base =
    process.env.NEXT_PUBLIC_Y_PROVIDER_URL ||
    (typeof window !== 'undefined' ? `wss://${window.location.host}/ws` : '');

  return `${base}/${docId}`;
};
