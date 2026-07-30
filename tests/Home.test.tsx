import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router';

// Rendered through the router, not bare: Home opts into chrome sleep via
// useUiState, which throws outside the provider AppChrome supplies.
function renderAt(path: string) {
  return render(
    <RouterProvider
      router={createMemoryRouter(routes, { initialEntries: [path] })}
    />,
  );
}

describe('homepage', () => {
  it('renders the site heading at /', () => {
    renderAt('/');
    expect(
      screen.getByRole('heading', { name: /wine without bottles/i }),
    ).toBeInTheDocument();
  });

  it('carries the global chrome, so it is no longer a dead end', () => {
    // The whole point of the flip: the homepage has a way into the project.
    renderAt('/');
    const navToggle = screen.getByRole('button', { name: 'WWOB' });
    const drawer = screen.getByRole('navigation', { name: 'Main' });
    expect(navToggle).toHaveAttribute('aria-expanded', 'false');
    expect(drawer).toHaveAttribute('inert');
    expect(screen.getByRole('link', { name: 'All Shows' })).toHaveAttribute(
      'href',
      '/all',
    );
    // …and the drawer marks Home as the current page.
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('active');
  });
});
