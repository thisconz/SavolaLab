import React from "react";
import { AppShell } from "./app/AppShell";
import { FeatureRouter } from "./app/router/router";

function App() {
  return (
    <AppShell>
      <FeatureRouter />
    </AppShell>
  );
}

export default App;
