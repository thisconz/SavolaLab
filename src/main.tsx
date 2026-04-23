import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";

/* --- Core Styles --- */
import "./index.css";

/**
 * 1. Environment Guard & Validation
 * Ensures the app doesn't boot if critical infra is missing.
 */
const validateEnvironment = () => {
  const required = ["VITE_SENTRY_DSN"];
  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0 && import.meta.env.PROD) {
    console.warn(`[ZENTHAR_SYSTEM]: Missing Environment Keys: ${missing.join(", ")}`);
  }
};

/**
 * 2. Asset Orchestration
 * Handles dynamic head updates without polluting global scope.
 */
const initializeAssets = () => {
  const faviconUrl = "/favicon.ico"; // Prefer public folder for static assets
  let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = faviconUrl;
};

/**
 * 3. Telemetry Initialisation
 */
const initializeTelemetry = () => {
  if (!import.meta.env.VITE_SENTRY_DSN || import.meta.env.DEV) return;

  //Sentry.init({
  //dsn: import.meta.env.VITE_SENTRY_DSN,
  //integrations: [
  //Sentry.browserTracingIntegration(),
  //Sentry.replayIntegration(),
  //],
  //tracesSampleRate: 1.0,
  //replaysSessionSampleRate: 0.1, // Lower in production to save quota
  //replaysOnErrorSampleRate: 1.0,
  //});
};

/**
 * 4. Boot Sequence
 */
const boot = () => {
  const container = document.getElementById("root");

  if (!container) {
    throw new Error("[ZENTHAR_KERNEL]: Root container mounting point not found.");
  }

  // Execute Boot Tasks
  validateEnvironment();
  initializeAssets();
  initializeTelemetry();

  const root = createRoot(container);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

// Execute Bootloader
boot();
