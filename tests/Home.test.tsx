import { act, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router';
import { HOME_ROTATE_MS } from '@/hooks/useRotatingArt';

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

describe('homepage art rotation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** The <main> carries both layer URLs and which one is on top. */
  function artState() {
    const main = screen.getByRole('main');
    return {
      live: main.getAttribute('data-live-layer'),
      a: main.style.getPropertyValue('--home-art-a'),
      b: main.style.getPropertyValue('--home-art-b'),
    };
  }

  /** Past the interval, plus the preload cap jsdom always has to wait out. */
  function advancePastReroll(ms = HOME_ROTATE_MS) {
    act(() => {
      vi.advanceTimersByTime(ms + 2000);
    });
  }

  it('holds the opening piece until the interval is up', () => {
    renderAt('/');
    const before = artState();
    act(() => {
      vi.advanceTimersByTime(HOME_ROTATE_MS - 1000);
    });
    expect(artState()).toEqual(before);
    expect(before.live).toBe('0');
    expect(before.a).toMatch(/^url\(\/shows\/\d+\.svg\)$/);
  });

  it('crossfades to a different piece on the second layer', () => {
    renderAt('/');
    const { a } = artState();
    advancePastReroll();
    const after = artState();
    // The incoming piece lands on the dark layer, which then becomes live —
    // that flip is what the CSS transitions.
    expect(after.live).toBe('1');
    expect(after.a).toBe(a);
    expect(after.b).toMatch(/^url\(\/shows\/\d+\.svg\)$/);
    expect(after.b).not.toBe(a);
  });

  it('pauses the clock while the tab is hidden', () => {
    renderAt('/');
    const before = artState();

    // visibilityState is a getter, so it has to be spied rather than assigned.
    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    visibility.mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    advancePastReroll(HOME_ROTATE_MS * 2);
    expect(artState()).toEqual(before);

    // Back in view, the banked remainder runs and the reroll happens.
    visibility.mockReturnValue('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    advancePastReroll();
    expect(artState().live).toBe('1');
  });
});
