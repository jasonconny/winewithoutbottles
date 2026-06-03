import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import App from './App';
import Builder from './routes/Builder';

export const routes: RouteObject[] = [
  { path: '/', element: <App /> },
  // Unlinked easter egg — discoverable only by visiting the URL directly.
  { path: '/builder', element: <Builder /> },
  { path: '*', element: <Navigate to="/" replace /> },
];
