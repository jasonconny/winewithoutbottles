import { render, screen } from '@testing-library/react';
import App from './App';

it('renders the welcome heading', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: /welcome to react/i }),
  ).toBeInTheDocument();
});
