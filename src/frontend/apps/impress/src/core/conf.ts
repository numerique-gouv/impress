export const baseApiUrl = () => {
  const origin =
    process.env.NEXT_PUBLIC_API_ORIGIN ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  return `${origin}${process.env.NEXT_PUBLIC_API_URL}`;
};

export const signalingUrl = () =>
  process.env.NEXT_PUBLIC_SIGNALING_URL ||
  (typeof window !== 'undefined' ? `wss://${window.location.host}/ws` : '');
