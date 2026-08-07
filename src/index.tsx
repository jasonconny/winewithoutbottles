import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// True italic faces alongside each upright: `index.css` ships `font-style:
// normal` only, so any italic without these gets a synthesized oblique.
// Roboto italic serves the Show info sheet's run line, Merriweather italic the
// <em> and essay links on /about. Both are unicode-range-subset like the
// uprights, so non-Latin italic files are never fetched.
import '@fontsource-variable/roboto/index.css';
import '@fontsource-variable/roboto/wght-italic.css';
import '@fontsource-variable/merriweather/index.css';
import '@fontsource-variable/merriweather/wght-italic.css';
import './index.scss';
import { routes } from './router';

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
