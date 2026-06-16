import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
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

  it('renders the piece + setlist at /shows/:id', async () => {
    renderAt('/shows/1972-08-27');
    // Heading appears once the loader's fetch resolves.
    expect(
      await screen.findByRole('heading', { name: '1972-08-27' }),
    ).toBeInTheDocument();
    // "Mexicali Blues" is unique to the setlist ("Dark Star" also appears as a tag).
    expect(screen.getByText('Mexicali Blues')).toBeInTheDocument();
    expect(screen.getByText('31:28')).toBeInTheDocument(); // Dark Star's duration
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('links the Barlow essay on /about', () => {
    renderAt('/about');
    expect(
      screen.getByRole('link', { name: /economy of ideas/i }),
    ).toBeInTheDocument();
  });
});
