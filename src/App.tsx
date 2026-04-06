import React from "react";
import { Toaster } from "sonner";
import { AppShell } from "./app/AppShell";
import { FeatureRouter } from "./app/router/router";

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <AppShell>
        <FeatureRouter />
      </AppShell>
    </>
  );
}
