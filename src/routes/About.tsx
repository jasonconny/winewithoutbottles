import { PAGE_GROUND } from '@/theme';
import { usePageMeta } from '@/hooks/usePageMeta';
import './About.scss';

export default function About() {
  usePageMeta('Wine Without Bottles: About', PAGE_GROUND);

  return (
    <main className="About">
      <h1>About</h1>

      <p>
        <em>Wine Without Bottles</em> translates Grateful Dead concert setlists
        into abstract striped images. Each stripe is a song: its color is
        derived from the song&rsquo;s title, its width from the song&rsquo;s
        duration. The idea is a machine that makes the art.
      </p>

      <p>The piece takes its name and its spirit from two essays:</p>

      <ul className="About-essays">
        <li>
          John Perry Barlow,{' '}
          <a
            href="https://www.wired.com/1994/03/economy-ideas/"
            rel="noopener noreferrer"
            target="_blank"
          >
            The Economy of Ideas: Selling Wine Without Bottles on the Global Net
          </a>{' '}
          (Wired, 1994) — Barlow was also a Grateful Dead lyricist.
        </li>
        <li>
          Sol LeWitt,{' '}
          <a
            href="https://mma.pages.tufts.edu/fah188/sol_lewitt/paragraphs%20on%20conceptual%20art.htm"
            rel="noopener noreferrer"
            target="_blank"
          >
            Paragraphs on Conceptual Art
          </a>{' '}
          (Artforum, 1967) — &ldquo;The idea becomes a machine that makes the
          art.&rdquo;
        </li>
      </ul>
    </main>
  );
}
