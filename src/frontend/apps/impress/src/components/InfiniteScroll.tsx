import { PropsWithChildren, useEffect, useRef } from 'react';

import { Box, BoxType } from '@/components';

interface InfiniteScrollProps extends BoxType {
  hasMore: boolean;
  isLoading: boolean;
  next: () => void;
  scrollContainer: HTMLElement | null;
}

export const InfiniteScroll = ({
  children,
  hasMore,
  isLoading,
  next,
  scrollContainer,
  ...boxProps
}: PropsWithChildren<InfiniteScrollProps>) => {
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!scrollContainer) {
      return;
    }

    const nextHandle = () => {
      if (!hasMore || isLoading) {
        return;
      }

      // To not wait until the end of the scroll to load more data
      const heightFromBottom = 150;

      const { scrollTop, clientHeight, scrollHeight } = scrollContainer;
      if (scrollTop + clientHeight >= scrollHeight - heightFromBottom) {
        next();
      }
    };

    const handleScroll = () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = setTimeout(nextHandle, 50);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, isLoading, next, scrollContainer]);

  return <Box {...boxProps}>{children}</Box>;
};
