import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('routing', () => {
  it('renders the builder easter egg at /builder', () => {
    renderAt('/builder');
    expect(
      screen.getByRole('heading', { name: /wwob svg builder/i }),
    ).toBeInTheDocument();
    // Builder sits inside the global chrome like every page.
    expect(screen.getByRole('button', { name: 'WWOB' })).toBeInTheDocument();
  });

  it('404s at the retired /placeholder route', async () => {
    // The holding page is gone: '/' is the real homepage now. A single stray
    // segment falls to '/:id', whose loader rejects anything not id-shaped.
    renderAt('/placeholder');
    expect(await screen.findByText('Page not found.')).toBeInTheDocument();
  });

  it('serves gallery pages at root-level slugs', async () => {
    renderAt('/1977');
    expect(
      await screen.findByRole('heading', { name: '1977' }),
    ).toBeInTheDocument();
    // waitFor on titles here and below: they're set in passive effects,
    // which can flush after the DOM mutation that resolved the findBy.
    await waitFor(() =>
      expect(document.title).toBe('Wine Without Bottles: 1977'),
    );
    // Rows link to show pages; the name comes from the img alt.
    expect(screen.getByRole('link', { name: /May 8, 1977/ })).toHaveAttribute(
      'href',
      '/19770508',
    );
  });

  it('serves tour and venue galleries', async () => {
    renderAt('/spring-1977');
    expect(
      await screen.findByRole('heading', { name: 'Spring 1977' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(document.title).toBe('Wine Without Bottles: Spring 1977'),
    );
    cleanup();

    renderAt('/madison-square-garden');
    expect(
      await screen.findByRole('heading', { name: 'Madison Square Garden' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(document.title).toBe(
        'Wine Without Bottles: Madison Square Garden',
      ),
    );
  });

  it('renders the 404 page for a stray single segment', async () => {
    // A single stray segment matches the root-level /:id show route, whose
    // loader throws a 404 for non-id-shaped params (async, hence findBy).
    renderAt('/nope');
    expect(await screen.findByText('Page not found.')).toBeInTheDocument();
    await waitFor(() =>
      expect(document.title).toBe('Wine Without Bottles: Not Found'),
    );
    // The 404 page is chromed, so the drawer offers a way out.
    expect(screen.getByRole('button', { name: 'WWOB' })).toBeInTheDocument();
  });

  it('renders the 404 page for multi-segment paths', async () => {
    renderAt('/no/such/page');
    expect(await screen.findByText('Page not found.')).toBeInTheDocument();
  });
});
