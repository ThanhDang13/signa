import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import * as SecureStore from "expo-secure-store";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  email: string;
  // Add other user fields as needed
};

// Storage adapter for expo-secure-store
const secureStorage = createJSONStorage<AuthTokens | null>(() => ({
  getItem: async (key) => {
    const value = await SecureStore.getItemAsync(key);
    console.log("[SecureStore] getItem:", key, value ? "has value" : "null");
    return value ? JSON.parse(value) : null;
  },
  setItem: async (key, value) => {
    console.log("[SecureStore] setItem:", key, value ? "setting value" : "null");
    await SecureStore.setItemAsync(key, JSON.stringify(value));
    console.log("[SecureStore] setItem complete");
  },
  removeItem: async (key) => {
    console.log("[SecureStore] removeItem:", key);
    await SecureStore.deleteItemAsync(key);
  }
}));

// Persisted storage atom (loads on init, persists changes)
const authTokensStorageAtom = atomWithStorage<AuthTokens | null>(
  "auth-tokens",
  null,
  secureStorage,
  { getOnInit: true }
);

// Primary public atom - simple primitive atom for synchronous reads/writes
export const authTokensAtom = atom<AuthTokens | null>(null);

// Sync effect: when authTokensAtom changes, persist to storage
authTokensAtom.onMount = (setAtom) => {
  console.log("[authTokensAtom] Mounted, setting up storage sync");
  return () => {
    console.log("[authTokensAtom] Unmounted");
  };
};

// Initialize memory from storage on app start
export const initAuthAtom = atom(null, async (get, set) => {
  console.log("[initAuthAtom] Loading tokens from storage");
  const storedTokens = await get(authTokensStorageAtom);
  console.log("[initAuthAtom] Loaded tokens:", storedTokens ? "has tokens" : "null");
  set(authTokensAtom, storedTokens);
});

// Action: set auth data and persist to storage
export const setAuthAtom = atom(
  null,
  (get, set, tokens: AuthTokens | null) => {
    console.log("[setAuthAtom] Setting tokens:", tokens ? "has tokens" : "null");
    // Update in-memory atom (triggers re-renders immediately)
    set(authTokensAtom, tokens);
    // Persist to storage in background
    set(authTokensStorageAtom, tokens);
    console.log("[setAuthAtom] Tokens set");
  }
);

// Current user state (not persisted, fetched from API)
export const authUserAtom = atom<AuthUser | null>(null);

// Derived: check if user is authenticated
export const isAuthenticatedAtom = atom((get) => {
  const tokens = get(authTokensAtom);
  return tokens !== null && tokens.accessToken !== "";
});

// Action: logout (clear tokens and user)
export const logoutAtom = atom(null, (_get, set) => {
  set(authTokensAtom, null);
  set(authTokensStorageAtom, null);
  set(authUserAtom, null);
});
