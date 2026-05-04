import { api } from "../core/http/client";
import { useAuthStore } from "./state/auth.store";

export function initializeApi() {
  const { logout, setToken } = useAuthStore.getState();

  // Registering handlers to the decoupled ApiClient
  api.setLogoutHandler(logout);
  api.setTokenHandler(setToken);
}
