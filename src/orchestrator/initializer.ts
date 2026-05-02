import { api } from "../core/http/client";
import { useAuthStore } from "./state/auth.store";

export function initializeApi() {
  // Pass the store actions into the client
  api.setLogoutHandler(() => useAuthStore.getState().logout());
  api.setTokenHandler((token) => useAuthStore.getState().setToken(token));
}