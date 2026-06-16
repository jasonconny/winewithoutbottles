import Footer from '@/components/Footer';
import './About.scss';

export default function About() {
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
          Sol LeWitt,{' '}
          {/* TODO: link once Jason confirms a canonical hosted copy of the essay. */}
          <em>&ldquo;Paragraphs on Conceptual Art&rdquo;</em> (Artforum, 1967) —
          &ldquo;The idea becomes a machine that makes the art.&rdquo;
        </li>
        <li>
          John Perry Barlow,{' '}
          <a href="https://www.wired.com/1994/03/economy-ideas/">
            &ldquo;The Economy of Ideas: Selling Wine Without Bottles on the
            Global Net&rdquo;
          </a>{' '}
          (Wired, 1994) — Barlow was also a Grateful Dead lyricist.
        </li>
      </ul>

      <Footer />
    </main>
  );
}
