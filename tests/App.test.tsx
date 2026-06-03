import { render, screen } from '@testing-library/react';
import App from '@/App';

it('renders the site heading', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: /wine without bottles/i }),
  ).toBeInTheDocument();
});
