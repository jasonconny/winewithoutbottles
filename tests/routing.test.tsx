import { render, screen } from '@testing-library/react';
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

  it('renders the placeholder at the hidden /placeholder route', () => {
    renderAt('/placeholder');
    expect(
      screen.getByRole('heading', { name: /wine without bottles/i }),
    ).toBeInTheDocument();
  });

  it('renders the 404 page for a stray single segment', async () => {
    // A single stray segment matches the root-level /:id show route, whose
    // loader throws a 404 for non-id-shaped params (async, hence findBy).
    renderAt('/nope');
    expect(await screen.findByText('Page not found.')).toBeInTheDocument();
    expect(document.title).toBe('Wine Without Bottles: Not Found');
    // The 404 page is chromed, so the drawer offers a way out.
    expect(screen.getByRole('button', { name: 'WWOB' })).toBeInTheDocument();
  });

  it('renders the 404 page for multi-segment paths', async () => {
    renderAt('/no/such/page');
    expect(await screen.findByText('Page not found.')).toBeInTheDocument();
  });
});
