import { Ed25519KeyIdentity } from '@dfinity/identity';

const LOCAL_SESSION_KEY = 'local_session_identity';

/**
 * Save a local session identity to localStorage
 */
export function saveLocalSessionIdentity(identity: Ed25519KeyIdentity): void {
  try {
    const keyPair = identity.getKeyPair();
    const serialized = JSON.stringify({
      publicKey: Array.from(keyPair.publicKey.toDer()),
      secretKey: Array.from(keyPair.secretKey),
    });
    localStorage.setItem(LOCAL_SESSION_KEY, serialized);
  } catch (error) {
    console.error('Failed to save local session identity:', error);
  }
}

/**
 * Load a local session identity from localStorage
 */
export function loadLocalSessionIdentity(): Ed25519KeyIdentity | null {
  try {
    const stored = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const secretKey = Uint8Array.from(parsed.secretKey);
    
    return Ed25519KeyIdentity.fromSecretKey(secretKey);
  } catch (error) {
    console.error('Failed to load local session identity:', error);
    return null;
  }
}

/**
 * Clear the local session identity from localStorage
 */
export function clearLocalSessionIdentity(): void {
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear local session identity:', error);
  }
}
