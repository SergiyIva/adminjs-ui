import { useCallback, useState } from "react";

export const useToggle = (
  initialState = false,
): [boolean, (arg?: boolean) => () => void] => {
  const [state, setState] = useState<boolean>(initialState);
  const toggle = useCallback((newState?: boolean) => {
    return () => {
      if (newState === undefined) {
        setState((state) => !state);
      } else {
        setState(newState);
      }
    };
  }, []);
  return [state, toggle];
};
