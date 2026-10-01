import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { RootErrorBoundary } from './components/RootErrorBoundary';
import './index.css';

function mountApplication() {
  try {
    let container = document.getElementById('root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'root';
      document.body.appendChild(container);
    }

    const root = createRoot(container);
    root.render(
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    );

    // Notify startup watchdog that React has initiated rendering
    if (typeof window !== 'undefined' && (window as any).__A_PLUS_STARTUP__) {
      (window as any).__A_PLUS_STARTUP__.markMounted();
    }
  } catch (err: any) {
    console.error('Fatal application mount failure:', err);
    if (typeof window !== 'undefined' && (window as any).__A_PLUS_STARTUP__) {
      (window as any).__A_PLUS_STARTUP__.reportError(err, 'React createRoot Mount Phase');
    }
  }
}

// Ensure DOM is ready before mounting
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApplication);
  } else {
    mountApplication();
  }
}
