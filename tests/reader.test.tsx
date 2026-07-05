import { readFileSync } from 'node:fs';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router';

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
  it('lists shows in the gallery at /shows', () => {
    renderAt('/shows');
    expect(
      screen.getByRole('heading', { name: /gallery/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('1972-08-27')).toBeInTheDocument();
  });

  it('renders the full-bleed piece with an info toggle at /shows/:id', async () => {
    renderAt('/shows/1972-08-27');
    // Art appears once the loader's fetch resolves.
    expect(
      await screen.findByRole('img', {
        name: '1972-08-27 setlist rendered as stripes',
      }),
    ).toBeInTheDocument();
    // Brand chip is the way back to the gallery.
    expect(screen.getByRole('link', { name: 'WWOB' })).toHaveAttribute(
      'href',
      '/shows',
    );
    // Info panel starts closed; toggling reveals the show metadata.
    const infoToggle = screen.getByRole('button', { name: 'i' });
    expect(infoToggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(infoToggle);
    expect(infoToggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText('Old Renaissance Faire Grounds, Veneta, OR'),
    ).toBeInTheDocument();
    // Light-dismiss: clicking anywhere else (e.g. the art) closes the panel…
    fireEvent.click(screen.getByRole('img'));
    expect(infoToggle).toHaveAttribute('aria-expanded', 'false');
    // …and the toggle itself still cleanly re-opens (no double-toggle).
    fireEvent.click(infoToggle);
    expect(infoToggle).toHaveAttribute('aria-expanded', 'true');
    // Esc is the keyboard companion to light-dismiss.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(infoToggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('puts the chrome to sleep after idle and wakes it on activity', async () => {
    renderAt('/shows/1972-08-27');
    const art = await screen.findByRole('img');
    const main = screen.getByRole('main');
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
      fireEvent.click(screen.getByRole('button', { name: 'i' }));
      act(() => vi.advanceTimersByTime(20000));
      expect(main).not.toHaveAttribute('data-chrome-asleep');
    } finally {
      vi.useRealTimers();
    }
  });

  it('links the Barlow essay on /about', () => {
    renderAt('/about');
    expect(
      screen.getByRole('link', { name: /economy of ideas/i }),
    ).toBeInTheDocument();
  });
});
