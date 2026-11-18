import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Design tokens are the single source of truth (docs/tokens.css).
import '../../../docs/tokens.css';
import './styles.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('#root tidak ditemukan');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
