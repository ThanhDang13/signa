import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import * as SecureStore from "expo-secure-store";

// Storage adapter for expo-secure-store
const secureStorage = createJSONStorage<AuthTokens | null>(() => ({
  getItem: async (key) => {
    const value = await SecureStore.getItemAsync(key);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (key, value) => {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  },
  removeItem: async (key) => {
    await SecureStore.deleteItemAsync(key);
  }
}));

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  email: string;
  // Add other user fields as needed
};

// Persisted auth tokens (encrypted via SecureStore)
export const authTokensAtom = atomWithStorage<AuthTokens | null>(
  "auth-tokens",
  null,
  secureStorage
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
  set(authUserAtom, null);
});

// Action: set auth data (login/register)
export const setAuthAtom = atom(
  null,
  (_get, set, tokens: AuthTokens) => {
    set(authTokensAtom, tokens);
  }
);
