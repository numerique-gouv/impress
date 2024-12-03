import { useConfig } from '../api';

export const useCollaborationUrl = (room?: string) => {
  const { data: conf } = useConfig();

  if (!room) {
    return;
  }

  const base =
    conf?.COLLABORATION_WS_URL ||
    (typeof window !== 'undefined'
      ? `wss://${window.location.host}/collaboration/ws/`
      : '');

  return `${base}?room=${room}`;
};
