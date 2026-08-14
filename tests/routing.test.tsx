import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router';
import { shows } from '@/data/shows.generated';

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

  it('summarises the corpus by year at /progress', () => {
    // Driven off the same bundled index the page reads, so adding shows never
    // makes this test wrong — only a page that stops agreeing with the index
    // does.
    const byYear = new Map<string, number>();
    for (const show of shows) {
      const year = show.date.slice(0, 4);
      byYear.set(year, (byYear.get(year) ?? 0) + 1);
    }

    renderAt('/progress');
    expect(
      screen.getByRole('heading', { name: 'Progress' }),
    ).toBeInTheDocument();

    // One row per year, plus the header and the total.
    expect(screen.getAllByRole('row')).toHaveLength(byYear.size + 2);

    // A year row reports that year's count and links to its gallery.
    const [year, count] = [...byYear][0];
    const yearRow = screen
      .getByRole('rowheader', { name: year })
      .closest('tr')!;
    expect(within(yearRow).getByRole('cell')).toHaveTextContent(String(count));
    expect(within(yearRow).getByRole('link')).toHaveAttribute(
      'href',
      `/${year}`,
    );

    const totalRow = screen
      .getByRole('rowheader', { name: 'Total' })
      .closest('tr')!;
    expect(within(totalRow).getByRole('cell')).toHaveTextContent(
      String(shows.length),
    );

    // Unlinked like /builder: reachable by URL, absent from the drawer.
    expect(
      screen.queryByRole('link', { name: /progress/i }),
    ).not.toBeInTheDocument();
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
