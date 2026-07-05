import { readFileSync } from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
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
  });

  it('links the Barlow essay on /about', () => {
    renderAt('/about');
    expect(
      screen.getByRole('link', { name: /economy of ideas/i }),
    ).toBeInTheDocument();
  });
});
