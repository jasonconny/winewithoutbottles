import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import Placeholder from './routes/Placeholder';
import Builder from './routes/Builder';

export const routes: RouteObject[] = [
  // Public holding page. When the real app is ready, repoint '/' to it; the
  // placeholder stays reachable at '/placeholder'.
  { path: '/', element: <Placeholder /> },
  { path: '/placeholder', element: <Placeholder /> },
  // Unlinked easter egg — discoverable only by visiting the URL directly.
  { path: '/builder', element: <Builder /> },
  { path: '*', element: <Navigate to="/" replace /> },
];
