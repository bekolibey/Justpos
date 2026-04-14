import { useEffect, useState } from 'react';

const COMPACT_POS_QUERY = '(max-width: 500px), (max-height: 820px)';

export const useCompactPos = () => {
  const [isCompactPos, setIsCompactPos] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia(COMPACT_POS_QUERY).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(COMPACT_POS_QUERY);

    const handleChange = () => {
      setIsCompactPos(mediaQuery.matches);
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isCompactPos;
};
