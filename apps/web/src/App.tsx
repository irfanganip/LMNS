import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { SessionProvider } from './auth/SessionProvider';
import { ToastProvider } from './components/Toast';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SessionProvider>
          <AppRoutes />
        </SessionProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
