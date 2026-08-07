import { readFileSync } from 'node:fs';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router';
import { shows } from '@/data/shows.generated';
import { formatShowDate } from '@/date';

// The Show route fetches per-show detail from /shows/<id>.json at runtime. Serve
// those generated files from disk so the data router's loader resolves in jsdom.
beforeAll(() => {
  vi.stubGlobal('fetch', async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString();
    const { pathname } = new URL(url, 'http://localhost');
    try {
      return new Response(readFileSync(`public${pathname}`, 'utf8'), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    } catch {
      return new Response('not found', { status: 404 });
    }
  });
});
afterAll(() => vi.unstubAllGlobals());

function renderAt(path: string) {
  return render(
    <RouterProvider
      router={createMemoryRouter(routes, { initialEntries: [path] })}
    />,
  );
}

describe('reader app', () => {
  it('lists shows in the gallery at /all', async () => {
    renderAt('/all');
    // The heading is sr-only (the page is visually pure artwork) but stays in
    // the accessibility tree; each show row's name comes from its img alt.
    // findBy: the route has a loader, so the first render is async.
    expect(
      await screen.findByRole('heading', { name: /all shows/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /August 27, 1972/ }),
    ).toHaveAttribute('href', '/19720827');
    // waitFor: the title is set in a passive effect, which can flush after
    // the DOM mutation that resolved the findBy above.
    await waitFor(() =>
      expect(document.title).toBe('Wine Without Bottles: All Shows'),
    );
    // The longest show on the page spans the full pane; the rest scale down.
    const longest = shows.reduce((best, show) =>
      show.durationSeconds > best.durationSeconds ? show : best,
    );
    expect(
      screen.getByRole('link', {
        name: new RegExp(formatShowDate(longest.date)),
      }),
    ).toHaveStyle({ width: '100%' });
    // Global chrome: the nav drawer is here too, inert until toggled.
    const navToggle = screen.getByRole('button', { name: 'WWOB' });
    const drawer = screen.getByRole('navigation', { name: 'Main' });
    expect(drawer).toHaveAttribute('inert');
    fireEvent.click(navToggle);
    expect(drawer).not.toHaveAttribute('inert');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about',
    );
    // The current page is marked; Home is not (NavLink's `end` stops `/` from
    // prefix-matching every route).
    expect(screen.getByRole('link', { name: 'All Shows' })).toHaveClass(
      'active',
    );
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveClass(
      'active',
    );
    // Sub-gallery links live in the drawer too, behind collapsed groups —
    // expand each one to reach them.
    fireEvent.click(screen.getByRole('button', { name: 'Years' }));
    expect(screen.getByRole('link', { name: '1977' })).toHaveAttribute(
      'href',
      '/1977',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tours' }));
    expect(screen.getByRole('link', { name: 'Spring 1977' })).toHaveAttribute(
      'href',
      '/spring-1977',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Venues' }));
    expect(
      screen.getByRole('link', { name: 'Madison Square Garden' }),
    ).toHaveAttribute('href', '/madison-square-garden');
  });

  it('renders the full-bleed piece with an info toggle at /:id', async () => {
    renderAt('/19720827');
    // Art appears once the loader's fetch resolves.
    expect(
      await screen.findByRole('img', {
        name: 'August 27, 1972 setlist rendered as stripes',
      }),
    ).toBeInTheDocument();
    // Route-managed document metadata (waitFor: set in a passive effect that
    // can flush after the DOM mutation that resolved the findBy above).
    await waitFor(() =>
      expect(document.title).toBe('Wine Without Bottles: 19720827'),
    );
    // Brand chip toggles the nav drawer; its links are inert while closed.
    const navToggle = screen.getByRole('button', { name: 'WWOB' });
    const drawer = screen.getByRole('navigation', { name: 'Main' });
    expect(navToggle).toHaveAttribute('aria-expanded', 'false');
    expect(drawer).toHaveAttribute('inert');
    fireEvent.click(navToggle);
    expect(navToggle).toHaveAttribute('aria-expanded', 'true');
    expect(drawer).not.toHaveAttribute('inert');
    expect(screen.getByRole('link', { name: 'All Shows' })).toHaveAttribute(
      'href',
      '/all',
    );
    fireEvent.click(navToggle); // close it again for the info-panel steps
    expect(drawer).toHaveAttribute('inert');
    // Info panel starts closed; toggling reveals the show metadata.
    const infoToggle = screen.getByRole('button', { name: 'i' });
    expect(infoToggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(infoToggle);
    expect(infoToggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText('Old Renaissance Faire Grounds, Veneta, OR'),
    ).toBeInTheDocument();
    expect(screen.getByText('Sunshine Daydream')).toBeInTheDocument(); // tag
    // Light-dismiss: clicking anywhere else (e.g. the art) closes the panel…
    fireEvent.click(screen.getByRole('img'));
    expect(infoToggle).toHaveAttribute('aria-expanded', 'false');
    // …and the toggle itself still cleanly re-opens (no double-toggle).
    fireEvent.click(infoToggle);
    expect(infoToggle).toHaveAttribute('aria-expanded', 'true');
    // With the sheet AND the drawer open, one art click closes both.
    fireEvent.click(navToggle);
    expect(navToggle).toHaveAttribute('aria-expanded', 'true');
    expect(infoToggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('img'));
    expect(navToggle).toHaveAttribute('aria-expanded', 'false');
    expect(infoToggle).toHaveAttribute('aria-expanded', 'false');
    // Esc is the keyboard companion to light-dismiss.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(infoToggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('links a show to its run from the info sheet', async () => {
    // 1974-10-16 opens the five-night Winterland stand. The run page is not in
    // the drawer, so this link is the only way to reach it.
    renderAt('/19741016');
    await screen.findByRole('img');
    fireEvent.click(screen.getByRole('button', { name: 'i' }));
    expect(
      screen.getByRole('link', { name: 'Winterland Arena October 1974' }),
    ).toHaveAttribute('href', '/winterland-arena-october-1974');
  });

  it('shows a run that spans dark days as one run', async () => {
    // 1988-09-24 is the last of nine MSG nights broken by union dark days;
    // naive date-adjacency would call this a separate three-night run.
    renderAt('/19880924');
    await screen.findByRole('img');
    fireEvent.click(screen.getByRole('button', { name: 'i' }));
    expect(
      screen.getByRole('link', {
        name: 'Madison Square Garden September 1988',
      }),
    ).toBeInTheDocument();
  });

  it('omits the run line for a one-off show', async () => {
    // Veneta 8/27/72 was a single night, so the sheet carries no run link.
    // Scoped to the sheet: the drawer has year/tour links of its own.
    renderAt('/19720827');
    await screen.findByRole('img');
    fireEvent.click(screen.getByRole('button', { name: 'i' }));
    const sheet = within(document.getElementById('show-info')!);
    // Year, tour, then the two tags — no run, since this was a single night.
    expect(sheet.getAllByRole('link').map((link) => link.textContent)).toEqual([
      '1972',
      'Summer 1972',
      'Sunshine Daydream',
      'Dark Star',
    ]);
    expect(sheet.getByRole('link', { name: '1972' })).toHaveAttribute(
      'href',
      '/1972',
    );
  });

  it('links the tour, before the run, on one line', async () => {
    renderAt('/19741016');
    await screen.findByRole('img');
    fireEvent.click(screen.getByRole('button', { name: 'i' }));
    const sheet = within(document.getElementById('show-info')!);
    expect(sheet.getByRole('link', { name: 'Fall 1974' })).toHaveAttribute(
      'href',
      '/fall-1974',
    );
    // Both labelled, and tour precedes run in document order.
    const line = document.querySelector('.Show-meta')!;
    expect(line.textContent).toBe(
      'Tour: Fall 1974Run: Winterland Arena October 1974',
    );
  });

  it('shows only a run when a show has no tour', async () => {
    // The 1969 Fillmore West nights carry no `tour` — they predate anything
    // that was really a tour — so the meta line is the run alone.
    renderAt('/19690227');
    await screen.findByRole('img');
    fireEvent.click(screen.getByRole('button', { name: 'i' }));
    expect(document.querySelector('.Show-meta')!.textContent).toBe(
      'Run: Fillmore West February 1969',
    );
  });

  it('links each tag to its tag index', async () => {
    // 1989-10-09 carries two tags of different kinds — a named run and a song.
    renderAt('/19891009');
    await screen.findByRole('img');
    fireEvent.click(screen.getByRole('button', { name: 'i' }));
    const sheet = within(document.getElementById('show-info')!);
    expect(
      sheet.getByRole('link', { name: 'Formerly the Warlocks' }),
    ).toHaveAttribute('href', '/formerly-the-warlocks');
    expect(sheet.getByRole('link', { name: 'Dark Star' })).toHaveAttribute(
      'href',
      '/dark-star',
    );
  });

  it('serves a tag index listing every show carrying that tag', async () => {
    renderAt('/dark-star');
    expect(
      await screen.findByRole('heading', { name: 'Dark Star' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(document.title).toBe('Wine Without Bottles: Dark Star'),
    );
    // A show reachable from more than one tag index proves the many-to-many
    // grouping the retired single-valued `collection` could not express.
    expect(
      screen.getByRole('link', { name: /August 27, 1972/ }),
    ).toHaveAttribute('href', '/19720827');
  });

  it('links the year in the heading to that year gallery', async () => {
    renderAt('/19741016');
    await screen.findByRole('img');
    fireEvent.click(screen.getByRole('button', { name: 'i' }));
    const sheet = within(document.getElementById('show-info')!);
    // Only the year is a link — the month and day stay plain text.
    expect(sheet.getByRole('link', { name: '1974' })).toHaveAttribute(
      'href',
      '/1974',
    );
    expect(sheet.getByRole('heading', { level: 2 })).toHaveTextContent(
      'October 16, 1974',
    );
  });

  it('puts the chrome to sleep after idle and wakes it on activity', async () => {
    renderAt('/19720827');
    const art = await screen.findByRole('img');
    // The sleep state lives on the AppChrome root, the page's chrome wrapper.
    const main = screen.getByRole('main').closest('.AppChrome')!;
    // Show registers `sleepy` via an effect after mount (setSleepy → context
    // update → chrome re-render → wake listeners attach). Flush that cascade
    // before switching clocks, or — depending on machine timing — the
    // pointermove below fires before the listeners exist and nothing gets
    // scheduled on the fake clock.
    await act(async () => {});
    // Switch to fake timers only after the loader resolved, then re-arm the
    // sleep timer under the fake clock with a wake event.
    vi.useFakeTimers();
    try {
      fireEvent.pointerMove(main);
      expect(main).not.toHaveAttribute('data-chrome-asleep');
      // 5s idle → asleep.
      act(() => vi.advanceTimersByTime(5001));
      expect(main).toHaveAttribute('data-chrome-asleep');
      // Activity wakes it.
      fireEvent.pointerMove(art);
      expect(main).not.toHaveAttribute('data-chrome-asleep');
      // An open info sheet pins the chrome awake past the idle delay.
      const infoToggle = screen.getByRole('button', { name: 'i' });
      fireEvent.click(infoToggle);
      act(() => vi.advanceTimersByTime(20000));
      expect(main).not.toHaveAttribute('data-chrome-asleep');
      fireEvent.click(infoToggle); // close the sheet
      // …and so does an open nav drawer.
      fireEvent.click(screen.getByRole('button', { name: 'WWOB' }));
      act(() => vi.advanceTimersByTime(20000));
      expect(main).not.toHaveAttribute('data-chrome-asleep');
    } finally {
      vi.useRealTimers();
    }
  });

  it('expands and collapses drawer gallery groups independently', async () => {
    renderAt('/all');
    await screen.findByRole('heading', { name: /all shows/i });
    fireEvent.click(screen.getByRole('button', { name: 'WWOB' }));

    const years = screen.getByRole('button', { name: 'Years' });
    const tours = screen.getByRole('button', { name: 'Tours' });
    // Panels are the group's links; inert while collapsed keeps them out of
    // the tab order and the a11y tree.
    const yearsPanel = document.getElementById('nav-section-years');
    const toursPanel = document.getElementById('nav-section-tours');

    // Everything starts collapsed.
    expect(years).toHaveAttribute('aria-expanded', 'false');
    expect(tours).toHaveAttribute('aria-expanded', 'false');
    expect(yearsPanel).toHaveAttribute('inert');
    expect(toursPanel).toHaveAttribute('inert');

    fireEvent.click(years);
    expect(years).toHaveAttribute('aria-expanded', 'true');
    expect(yearsPanel).not.toHaveAttribute('inert');

    // Open groups are not exclusive: opening Tours leaves Years open.
    fireEvent.click(tours);
    expect(years).toHaveAttribute('aria-expanded', 'true');
    expect(tours).toHaveAttribute('aria-expanded', 'true');

    // Clicking again closes only that group.
    fireEvent.click(years);
    expect(years).toHaveAttribute('aria-expanded', 'false');
    expect(yearsPanel).toHaveAttribute('inert');
    expect(tours).toHaveAttribute('aria-expanded', 'true');
    expect(toursPanel).not.toHaveAttribute('inert');

    // Toggling a group must not trip the drawer's light-dismiss.
    expect(
      screen.getByRole('navigation', { name: 'Main' }),
    ).not.toHaveAttribute('inert');
  });

  it('renders the global 404 for an id-shaped URL with no show', async () => {
    // The loader throws a 404 Response; the route's errorElement is NotFound.
    renderAt('/19990101');
    expect(await screen.findByText('Page not found.')).toBeInTheDocument();
    await waitFor(() =>
      expect(document.title).toBe('Wine Without Bottles: Not Found'),
    );
    expect(screen.getByRole('link', { name: /back home/i })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('links the Barlow essay on /about', () => {
    renderAt('/about');
    expect(
      screen.getByRole('link', { name: /economy of ideas/i }),
    ).toBeInTheDocument();
    // Global chrome is present here too.
    expect(screen.getByRole('button', { name: 'WWOB' })).toBeInTheDocument();
  });
});
