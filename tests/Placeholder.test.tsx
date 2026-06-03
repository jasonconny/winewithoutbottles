import { render, screen } from '@testing-library/react';
import Placeholder from '@/routes/Placeholder';

it('renders the site heading', () => {
  render(<Placeholder />);
  expect(
    screen.getByRole('heading', { name: /wine without bottles/i }),
  ).toBeInTheDocument();
});
