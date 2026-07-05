import { createContext, useContext } from 'react';

/**
 * Global UI state shared between the chrome (AppChrome) and the pages it
 * wraps: who has an overlay open, whether the current page wants chrome
 * sleep, and whether the chrome is currently awake. Provided by
 * UiStateProvider (inside AppChrome, so it spans navigation between chromed
 * routes); consume with `useUiState()` anywhere below.
 */
export interface UiState {
  /** Nav drawer open (chrome-owned, persists across navigation). */
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  /** Info sheet open (page-owned; the chrome resets it on navigation). */
  infoOpen: boolean;
  setInfoOpen: (open: boolean) => void;
  /** Current page wants chrome sleep (art pages opt in). */
  sleepy: boolean;
  setSleepy: (sleepy: boolean) => void;
  /** Chrome awake/asleep (managed by AppChrome's idle timer). */
  chromeAwake: boolean;
  setChromeAwake: (awake: boolean) => void;
  /** Close every overlay (light-dismiss / Esc). */
  closeOverlays: () => void;
}

export const UiStateContext = createContext<UiState | null>(null);

export function useUiState(): UiState {
  const state = useContext(UiStateContext);
  if (!state) {
    throw new Error('useUiState must be used inside a UiStateProvider');
  }
  return state;
}
