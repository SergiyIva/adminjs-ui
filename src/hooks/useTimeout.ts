import { useCallback, useEffect, useRef } from "react";

export const useTimeout = (callback: (arg?: any) => void, delay?: number) => {
  const timerRef = useRef<null | NodeJS.Timeout>(null);
  const savedCallback = useRef(callback);
  const start = useRef<null | number>(null);
  const remaining = useRef(delay);

  useEffect(() => {
    return () => clearTime();
  }, []);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const setTime = useCallback(
    (arg?: any) => {
      clearTime();
      start.current = Date.now();
      //@ts-ignore
      timerRef.current = setTimeout(
        () => savedCallback.current(arg),
        arg?.delay ? arg.delay : remaining.current,
      );
    },
    [start, timerRef, savedCallback, remaining],
  );

  const clearTime = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    start.current = null;
    remaining.current = delay;
  }, [timerRef, start, remaining, delay]);

  const pause = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (!remaining.current || !start.current) return;
    remaining.current -= Date.now() - start.current;
  }, [timerRef, clearTimeout, start, remaining]);

  const resume = useCallback(() => {
    if (timerRef.current) return;
    start.current = Date.now();
    //@ts-ignore
    timerRef.current = setTimeout(
      () => savedCallback.current(),
      remaining.current,
    );
  }, [timerRef, remaining, start, savedCallback]);

  return [setTime, clearTime, pause, resume];
};
