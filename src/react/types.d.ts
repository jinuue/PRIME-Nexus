/// <reference types="vite/client" />

interface LegacyApp {
  user: unknown;
  navigate: (hash: string) => void;
  login: (user: unknown) => void;
  logout: () => void;
  render: () => void;
}

declare global {
  interface Window {
    APP?: LegacyApp;
  }
}

export {};
