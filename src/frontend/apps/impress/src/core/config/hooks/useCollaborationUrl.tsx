import { useMemo } from 'react';

import { useConfig } from '../api';

export const useCollaborationUrl = (room?: string) => {
  const { data: conf } = useConfig();

  return useMemo(() => {
    if (!room) {
      return;
    }

    const base =
      conf?.COLLABORATION_WS_BASE_URL ||
      (typeof window !== 'undefined' ? `wss://${window.location.host}` : '');

    const wsUrl = `${base}/collaboration/ws/?room=${room}`;

    let basePool = base.replace('ws:', 'http:');
    if (base.includes('wss:')) {
      basePool = base.replace('wss:', 'https:');
    }
    const poolUrl = `${basePool}/collaboration/pool/?room=${room}`;

    return { wsUrl, poolUrl };
  }, [room, conf]);
};
