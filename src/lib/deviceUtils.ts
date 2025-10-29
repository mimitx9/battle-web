/**
 * Utility functions for device detection
 */

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
};

export const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktopDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return !isMobileDevice() && !isTabletDevice();
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (isMobileDevice()) return 'mobile';
  if (isTabletDevice()) return 'tablet';
  return 'desktop';
};

