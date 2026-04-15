import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.tsx'
import { config } from './config'

/**
 * Apply glassmorphism tokens BEFORE React mounts so the first paint already
 * has the dark background (prevents a white flash, especially inside Telegram WebApp).
 */
if (config.THEME_GLASSMORPHISM_ENABLE === 'true') {
  document.documentElement.setAttribute('data-shm-glass', 'true');
  document.documentElement.style.backgroundColor = '#0A1628';
  document.body.style.backgroundColor = '#0A1628';

  const tg = (window as unknown as { Telegram?: { WebApp?: { setHeaderColor?: (c: string) => void; setBackgroundColor?: (c: string) => void } } }).Telegram?.WebApp;
  try {
    tg?.setHeaderColor?.('#0A1628');
    tg?.setBackgroundColor?.('#0A1628');
  } catch {
    /* Telegram WebApp API not available in non-TG contexts */
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
