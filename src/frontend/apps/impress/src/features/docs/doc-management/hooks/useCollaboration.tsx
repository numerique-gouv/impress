import { useEffect, useRef, useState } from 'react';

import { useCollaborationUrl } from '@/core/config';
import { useBroadcastStore } from '@/stores';

import { useProviderStore } from '../stores/useProviderStore';
import { Base64 } from '../types';

export const useCollaboration = (room?: string, initialContent?: Base64) => {
  const collaborationUrl = useCollaborationUrl(room);
  const { setBroadcastProvider } = useBroadcastStore();
  const {
    provider,
    createProvider,
    destroyProvider,
    withPolling,
    pollRequest,
  } = useProviderStore();
  const [pollingInterval] = useState(1500);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!room || !collaborationUrl || provider) {
      return;
    }

    console.log('Create provider');

    const newProvider = createProvider(collaborationUrl, room, initialContent);
    setBroadcastProvider(newProvider);
  }, [
    provider,
    collaborationUrl,
    room,
    initialContent,
    createProvider,
    setBroadcastProvider,
  ]);

  useEffect(() => {
    console.log('Polling:', withPolling);
    console.log('intervalRef.current:', intervalRef.current);
    const clearCurrentInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };

    if (!withPolling && intervalRef.current) {
      clearCurrentInterval();
    }

    if (!withPolling || !collaborationUrl?.poolUrl || intervalRef.current) {
      return;
    }

    intervalRef.current = setInterval(() => {
      void pollRequest(collaborationUrl.poolUrl);
    }, pollingInterval);

    return () => {
      console.log('Clearing interval');
      clearCurrentInterval();
    };
  }, [collaborationUrl?.poolUrl, pollRequest, pollingInterval, withPolling]);

  useEffect(() => {
    return () => {
      console.log('Destroying provider');
      destroyProvider();
    };
  }, [destroyProvider]);
};
