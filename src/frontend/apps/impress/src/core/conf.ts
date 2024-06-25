export const baseApiUrl = (apiVersion: string = '1.0') => {
  const origin =
    process.env.NEXT_PUBLIC_API_ORIGIN ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  return `${origin}/api/v${apiVersion}/`;
};

export const signalingUrl = (docId: string) => {
  const base =
    process.env.NEXT_PUBLIC_SIGNALING_URL ||
    (typeof window !== 'undefined' ? `wss://${window.location.host}/ws` : '');

  return `${base}/${docId}`;
};
