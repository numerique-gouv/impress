import { create } from 'zustand';

export type ScreenSize = 'small-mobile' | 'mobile' | 'tablet' | 'desktop';

export interface UseResponsiveStore {
  isMobile: boolean;
  isTablet: boolean;
  isMobileMenuOpen: boolean;
  isSmallMobile: boolean;
  screenSize: ScreenSize;
  screenWidth: number;
  setScreenSize: (size: ScreenSize) => void;
  toggleMobileMenu: () => void;
  isResponsive: boolean;
  initializeResizeListener: () => () => void;
}

const initialState = {
  isMobile: false,
  isTablet: false,
  isSmallMobile: false,
  isResponsive: false,
  isMobileMenuOpen: false,
  screenSize: 'desktop' as ScreenSize,
  screenWidth: 0,
};

export const useResponsiveStore = create<UseResponsiveStore>((set, get) => ({
  isMobile: initialState.isMobile,
  isTablet: initialState.isTablet,
  isSmallMobile: initialState.isSmallMobile,
  screenSize: initialState.screenSize,
  isMobileMenuOpen: initialState.isMobileMenuOpen,
  screenWidth: initialState.screenWidth,
  setScreenSize: (size: ScreenSize) => set(() => ({ screenSize: size })),
  isResponsive: initialState.isResponsive,
  toggleMobileMenu: () => {
    set((old) => ({ isMobileMenuOpen: !old.isMobileMenuOpen }));
  },
  initializeResizeListener: () => {
    const resizeHandler = () => {
      const width = window.innerWidth;
      if (width < 560) {
        set({
          isResponsive: true,
          screenSize: 'small-mobile',
          isMobile: true,
          isTablet: false,
          isSmallMobile: true,
        });
      } else if (width < 768) {
        set({
          isResponsive: true,
          screenSize: 'mobile',
          isTablet: false,
          isMobile: true,
          isSmallMobile: false,
        });
      } else if (width >= 768 && width < 1024) {
        set({
          isResponsive: true,
          screenSize: 'tablet',
          isTablet: true,
          isMobile: false,
          isSmallMobile: false,
        });
      } else {
        set({
          isResponsive: false,
          screenSize: 'desktop',
          isTablet: false,
          isMobile: false,
          isSmallMobile: false,
        });
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
