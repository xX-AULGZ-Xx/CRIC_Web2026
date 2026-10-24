'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function LucideHydrator() {
  const pathname = usePathname();

  useEffect(() => {
    function initLucide() {
      if (typeof window !== 'undefined' && (window as any).lucide?.createIcons) {
        try {
          (window as any).lucide.createIcons();
        } catch {
          // ignore error
        }
      }
    }

    initLucide();
    const t1 = setTimeout(initLucide, 100);
    const t2 = setTimeout(initLucide, 300);
    const t3 = setTimeout(initLucide, 800);

    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        initLucide();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (observer) observer.disconnect();
    };
  }, [pathname]);

  return null;
}

export default LucideHydrator;
