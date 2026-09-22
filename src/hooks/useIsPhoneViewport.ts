import { useEffect, useState } from 'react';

// Mirrors the Android manifest's tablet cutoff (requiresSmallestWidthDp="600") — a viewport
// whose *smaller* dimension is under this is treated as a phone, regardless of orientation.
const PHONE_BREAKPOINT = 600;

function computeIsPhone(): boolean {
  return Math.min(window.innerWidth, window.innerHeight) < PHONE_BREAKPOINT;
}

export function useIsPhoneViewport(): boolean {
  const [isPhone, setIsPhone] = useState(() => (typeof window === 'undefined' ? false : computeIsPhone()));

  useEffect(() => {
    const check = () => setIsPhone(computeIsPhone());
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  return isPhone;
}
