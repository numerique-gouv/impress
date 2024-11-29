import { useConfig } from '../api';

export const useMediaUrl = () => {
  const { data: conf } = useConfig();

  return (
    conf?.MEDIA_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  );
};
