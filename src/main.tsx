import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary as GlobalErrorBoundary } from "./app/components/GlobalErrorBoundary";
import faviconUrl from "./assets/favicon.ico";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
if (link) {
  link.href = faviconUrl;
} else {
  const newLink = document.createElement("link");
  newLink.rel = "icon";
  newLink.href = faviconUrl;
  document.head.appendChild(newLink);
}

// Sentry.init({
//  dsn: import.meta.env.VITE_SENTRY_DSN,
//  integrations: [
//    Sentry.browserTracingIntegration(),
//    Sentry.replayIntegration(),
//  ],
//  tracesSampleRate: 1.0,
//  replaysSessionSampleRate: 1.0,
//  replaysOnErrorSampleRate: 1.0,
//  sendDefaultPii: true,
// });

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </StrictMode>,
  );
}

