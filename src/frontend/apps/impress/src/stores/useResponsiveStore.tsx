import { create } from 'zustand';

export type ScreenSize = 'small-mobile' | 'mobile' | 'tablet' | 'desktop';

export interface UseResponsiveStore {
  isMobile: boolean;
  isSmallMobile: boolean;
  screenSize: ScreenSize;
  screenWidth: number;
  setScreenSize: (size: ScreenSize) => void;
  initializeResizeListener: () => () => void;
}

const initialState = {
  isMobile: false,
  isSmallMobile: false,
  screenSize: 'desktop' as ScreenSize,
  screenWidth: 0,
};

export const useResponsiveStore = create<UseResponsiveStore>((set) => ({
  isMobile: initialState.isMobile,
  isSmallMobile: initialState.isSmallMobile,
  screenSize: initialState.screenSize,
  screenWidth: initialState.screenWidth,
  setScreenSize: (size: ScreenSize) => set(() => ({ screenSize: size })),
  initializeResizeListener: () => {
    const resizeHandler = () => {
      const width = window.innerWidth;
      if (width < 560) {
        set({
          screenSize: 'small-mobile',
          isMobile: true,
          isSmallMobile: true,
        });
      } else if (width < 768) {
        set({ screenSize: 'mobile', isMobile: true, isSmallMobile: false });
      } else if (width >= 768 && width < 1024) {
        set({ screenSize: 'tablet', isMobile: false, isSmallMobile: false });
      } else {
        set({ screenSize: 'desktop', isMobile: false, isSmallMobile: false });
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
