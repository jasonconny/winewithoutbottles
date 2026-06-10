import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router';

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

  it('renders the piece + setlist at /shows/:id', () => {
    renderAt('/shows/1972-08-27');
    expect(
      screen.getByRole('heading', { name: '1972-08-27' }),
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
