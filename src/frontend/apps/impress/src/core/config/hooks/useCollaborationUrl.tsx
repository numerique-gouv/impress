import { useConfig } from '../api';

export const useCollaborationUrl = (room?: string) => {
  const { data: conf } = useConfig();

  if (!room) {
    return;
  }

  const base =
    conf?.COLLABORATION_SERVER_URL ||
    (typeof window !== 'undefined' ? `wss://${window.location.host}/ws` : '');

  return `${base}/${room}`;
};
