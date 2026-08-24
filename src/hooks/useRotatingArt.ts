import { useEffect, useRef, useState } from 'react';
import { shows } from '@/data/shows.generated';

/** How long a piece stays on the wall before the homepage rerolls. */
export const HOME_ROTATE_MS = 15 * 60 * 1000;

/**
 * How long we'll wait for the incoming SVG to load before fading to it anyway.
 * The incoming layer sits at opacity 0, so fading to an unloaded piece reveals
 * the black ground; but a slow network must not stall the rotation forever.
 */
const PRELOAD_CAP_MS = 1500;

/** A random index into `shows`, never the one currently on the wall. */
function pickNext(current: number): number {
  if (shows.length < 2) return current;
  let next = Math.floor(Math.random() * shows.length);
  if (next === current) next = (next + 1) % shows.length;
  return next;
}

// The opening piece is chosen once per page load, at module eval — not during
// render, which must stay pure. A full reload picks a fresh one.
const firstIndex = shows.length ? Math.floor(Math.random() * shows.length) : -1;

export interface RotatingArt {
  /** The two crossfade layers, by URL. The caller stacks and fades them. */
  layers: [string | undefined, string | undefined];
  /** Which layer is currently on top (opacity 1). */
  live: 0 | 1;
}

/**
 * Rerolls the homepage's striped piece every `intervalMs`, alternating between
 * two layers so the caller can crossfade rather than cut.
 *
 * The clock only runs while the tab is visible: hiding the tab banks the
 * elapsed time and re-arms with the remainder on return, so the reroll always
 * happens with someone watching — come back after an hour and the piece you
 * left is still on the wall.
 */
export function useRotatingArt(
  intervalMs: number = HOME_ROTATE_MS,
): RotatingArt {
  // One state object, not two: which layer is live and what's on it change
  // together, and the swap reads the live layer from the updater rather than
  // from a ref (reading a ref during render is what react-hooks/refs forbids).
  const [art, setArt] = useState<RotatingArt>(() => ({
    layers: [shows[firstIndex]?.svg, undefined],
    live: 0,
  }));

  // A ref, not state: the timer effect tracks which piece is showing without
  // wanting to re-arm when it changes.
  const indexRef = useRef(firstIndex);

  useEffect(() => {
    if (shows.length < 2) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let capTimer: ReturnType<typeof setTimeout> | undefined;
    let preloader: HTMLImageElement | undefined;
    // Remaining time on the current piece, banked whenever the tab hides.
    let remaining = intervalMs;
    let startedAt = Date.now();

    const swap = (url: string) => {
      // The incoming piece lands on the dark layer and that layer becomes live
      // in the same update, so one recalc runs and only `opacity` transitions.
      setArt((current) => {
        const next = current.live === 0 ? 1 : 0;
        const layers: [string | undefined, string | undefined] = [
          ...current.layers,
        ];
        layers[next] = url;
        return { layers, live: next };
      });
      remaining = intervalMs;
      startedAt = Date.now();
      arm();
    };

    const reroll = () => {
      const index = pickNext(indexRef.current);
      indexRef.current = index;
      const url = shows[index].svg;

      // Fade only once the piece is decoded (or we've waited long enough).
      let done = false;
      const go = () => {
        if (done) return;
        done = true;
        clearTimeout(capTimer);
        swap(url);
      };
      preloader = new Image();
      preloader.onload = go;
      preloader.onerror = go;
      preloader.src = url;
      capTimer = setTimeout(go, PRELOAD_CAP_MS);
    };

    function arm() {
      clearTimeout(timer);
      if (document.visibilityState !== 'visible') return;
      startedAt = Date.now();
      timer = setTimeout(reroll, remaining);
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        arm();
      } else {
        clearTimeout(timer);
        timer = undefined;
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
      }
    };

    arm();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearTimeout(timer);
      clearTimeout(capTimer);
      if (preloader) {
        preloader.onload = null;
        preloader.onerror = null;
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [intervalMs]);

  return art;
}
