export const mediaUrl = () =>
  process.env.NEXT_PUBLIC_MEDIA_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export const backendUrl = () =>
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export const baseApiUrl = (apiVersion: string = '1.0') =>
  `${backendUrl()}/api/v${apiVersion}/`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const signalingUrl = (_docId: string) => {
  const base =
    process.env.NEXT_PUBLIC_SIGNALING_URL ||
    (typeof window !== 'undefined' ? `wss://${window.location.host}/ws` : '');

  return `${base}`;
};
