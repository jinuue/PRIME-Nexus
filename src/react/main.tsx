import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('react-root');

if (container) {
  const root = createRoot(container);
  // Avoid StrictMode during the legacy bridge to prevent double-invoked effects.
  root.render(<App />);
}
