import { fireEvent, render, screen } from '@testing-library/react';
import Builder from '@/routes/Builder';

function addSong(title: string, duration: string) {
  fireEvent.change(screen.getByLabelText(/song title/i), {
    target: { value: title },
  });
  fireEvent.change(screen.getByLabelText(/duration/i), {
    target: { value: duration },
  });
  fireEvent.click(screen.getByRole('button', { name: /add song/i }));
}

describe('Builder', () => {
  it('adds a stripe to the preview', () => {
    const { container } = render(<Builder />);
    addSong('Dark Star', '7:42');
    expect(container.querySelectorAll('rect')).toHaveLength(1);
  });

  it('shows an error when the fields are invalid', () => {
    render(<Builder />);
    fireEvent.click(screen.getByRole('button', { name: /add song/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders SVG source on demand', () => {
    render(<Builder />);
    addSong('Sugaree', '6:00');
    fireEvent.click(screen.getByRole('button', { name: /render svg/i }));
    const source = screen.getByLabelText(/svg source/i) as HTMLTextAreaElement;
    expect(source.value).toContain('<svg');
  });

  it('removes the last stripe and resets', () => {
    const { container } = render(<Builder />);
    addSong('Bertha', '5:30');
    addSong('Jack Straw', '4:50');
    expect(container.querySelectorAll('rect')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /remove last/i }));
    expect(container.querySelectorAll('rect')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(container.querySelectorAll('rect')).toHaveLength(0);
  });
});
