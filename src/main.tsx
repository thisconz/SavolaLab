import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary as GlobalErrorBoundary } from "./app/components/GlobalErrorBoundary";
import * as Sentry from "@sentry/react";

// Sentry.init({
//     dsn: import.meta.env.VITE_SENTRY_DSN,
//     release: "labrix-v1.0",
//     integrations: [Sentry.browserTracingIntegration()],
//   });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);
