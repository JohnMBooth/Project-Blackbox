import { useEffect, useRef } from 'react';

export function useAutosave<T>(
  data: T,
  saveFn: () => Promise<void>,
  interval: number,
  enabled: boolean = true,
): void {
  const savedDataRef = useRef<T>(data);
  const saveFnRef = useRef(saveFn);

  saveFnRef.current = saveFn;

  useEffect(() => {
    savedDataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!enabled || interval <= 0) return;

    const timer = setInterval(async () => {
      try {
        await saveFnRef.current();
      } catch (e) {
        console.error('Autosave failed:', e);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [interval, enabled]);
}
