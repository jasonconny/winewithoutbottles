import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import Placeholder from './routes/Placeholder';
import Builder from './routes/Builder';
import Gallery from './routes/Gallery';
import Show from './routes/Show';
import About from './routes/About';

export const routes: RouteObject[] = [
  // Public holding page. When the real app is ready, repoint '/' to it; the
  // placeholder stays reachable at '/placeholder'.
  { path: '/', element: <Placeholder /> },
  { path: '/placeholder', element: <Placeholder /> },
  // Reader app (hidden for now — home flip is a later step).
  { path: '/shows', element: <Gallery /> },
  { path: '/shows/:id', element: <Show /> },
  { path: '/about', element: <About /> },
  // Unlinked easter egg — discoverable only by visiting the URL directly.
  { path: '/builder', element: <Builder /> },
  { path: '*', element: <Navigate to="/" replace /> },
];
