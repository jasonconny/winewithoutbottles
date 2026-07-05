import { createContext, useContext, useEffect } from 'react';

/** What AppChrome exposes to the pages it wraps (via ChromeContext). */
export interface ChromeApi {
  /** Portal target inside the chip bar for page-specific chips. */
  chipSlot: HTMLElement | null;
  setSleepy: (sleepy: boolean) => void;
  setPinAwake: (pinned: boolean) => void;
}

export const ChromeContext = createContext<ChromeApi | null>(null);

export function useChromeApi(caller: string): ChromeApi {
  const api = useContext(ChromeContext);
  if (!api) {
    throw new Error(`${caller} must be used inside an AppChrome layout route`);
  }
  return api;
}

/**
 * Configure the surrounding AppChrome from a page. `sleepy` enables chrome
 * sleep (art pages); `pinAwake` holds the chrome awake while page UI (e.g.
 * Show's info sheet) is open. Both reset when the page unmounts.
 */
export function usePageChrome({ sleepy = false, pinAwake = false } = {}) {
  const { setSleepy, setPinAwake } = useChromeApi('usePageChrome');

  useEffect(() => {
    setSleepy(sleepy);
    return () => setSleepy(false);
  }, [sleepy, setSleepy]);

  useEffect(() => {
    setPinAwake(pinAwake);
    return () => setPinAwake(false);
  }, [pinAwake, setPinAwake]);
}
