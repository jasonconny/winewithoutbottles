import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { UiStateContext } from '@/hooks/useUiState';
import type { UiState } from '@/hooks/useUiState';

/**
 * Owns the global UI state (see useUiState). Rendered by AppChrome around
 * the chrome shell, so the state lives at the layout level and survives
 * navigation between chromed routes.
 */
export default function UiStateProvider({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [sleepy, setSleepy] = useState(false);
  const [chromeAwake, setChromeAwake] = useState(true);

  const closeOverlays = useCallback(() => {
    setNavOpen(false);
    setInfoOpen(false);
  }, []);

  // useState setters are stable, so the value only changes with the state.
  const value = useMemo<UiState>(
    () => ({
      navOpen,
      setNavOpen,
      infoOpen,
      setInfoOpen,
      sleepy,
      setSleepy,
      chromeAwake,
      setChromeAwake,
      closeOverlays,
    }),
    [navOpen, infoOpen, sleepy, chromeAwake, closeOverlays],
  );

  return (
    <UiStateContext.Provider value={value}>{children}</UiStateContext.Provider>
  );
}
