export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Song {
  title: string;
  /** Song length in whole seconds. */
  durationSeconds: number;
}

export interface Stripe {
  title: string;
  rgb: Rgb;
  /** Stripe width in pixels (100px per minute). */
  width: number;
  /** Cumulative x offset of this stripe within the piece. */
  x: number;
}
