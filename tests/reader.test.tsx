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
    expect(document.title).toBe('Gallery — Wine Without Bottles');
  });

  it('renders the full-bleed piece with an info toggle at /shows/:id', async () => {
    renderAt('/shows/1972-08-27');
    // Art appears once the loader's fetch resolves.
    expect(
      await screen.findByRole('img', {
        name: '1972-08-27 setlist rendered as stripes',
      }),
    ).toBeInTheDocument();
    // Route-managed document metadata.
    expect(document.title).toBe('1972-08-27 — Wine Without Bottles');
    // Brand chip toggles the nav drawer; its links are inert while closed.
    const navToggle = screen.getByRole('button', { name: 'WWOB' });
    const drawer = screen.getByRole('navigation', { name: 'Main' });
    expect(navToggle).toHaveAttribute('aria-expanded', 'false');
    expect(drawer).toHaveAttribute('inert');
    fireEvent.click(navToggle);
    expect(navToggle).toHaveAttribute('aria-expanded', 'true');
    expect(drawer).not.toHaveAttribute('inert');
    expect(screen.getByRole('link', { name: 'Gallery' })).toHaveAttribute(
      'href',
      '/shows',
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

  it('links the Barlow essay on /about', () => {
    renderAt('/about');
    expect(
      screen.getByRole('link', { name: /economy of ideas/i }),
    ).toBeInTheDocument();
  });
});
