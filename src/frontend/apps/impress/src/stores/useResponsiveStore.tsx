import { create } from 'zustand';

type ScreenSize = 'small-mobile' | 'mobile' | 'tablet' | 'desktop';

export interface UseResponsiveStore {
  isMobile: boolean;
  screenSize: ScreenSize;
  screenWidth: number;
  setScreenSize: (size: ScreenSize) => void;
  initializeResizeListener: () => () => void;
}

const initialState = {
  isMobile: false,
  screenSize: 'desktop' as ScreenSize,
  screenWidth: 0,
};

export const useResponsiveStore = create<UseResponsiveStore>((set) => ({
  isMobile: initialState.isMobile,
  screenSize: initialState.screenSize,
  screenWidth: initialState.screenWidth,
  setScreenSize: (size: ScreenSize) => set(() => ({ screenSize: size })),
  initializeResizeListener: () => {
    const resizeHandler = () => {
      const width = window.innerWidth;
      if (width < 520) {
        set({ screenSize: 'small-mobile', isMobile: true });
      } else if (width < 768) {
        set({ screenSize: 'mobile', isMobile: true });
      } else if (width >= 768 && width < 1024) {
        set({ screenSize: 'tablet', isMobile: false });
      } else {
        set({ screenSize: 'desktop', isMobile: false });
      }

      set({ screenWidth: width });
    };

    const debouncedResizeHandler = () => {
      setTimeout(() => {
        resizeHandler();
      }, 300);
    };

    window.addEventListener('resize', debouncedResizeHandler);

    resizeHandler();

    return () => {
      window.removeEventListener('resize', debouncedResizeHandler);
    };
  },
}));
