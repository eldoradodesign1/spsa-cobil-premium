/** SPSA COBIL — Nebula : coffre local AES-GCM pour les données de pilotage. */
import { AppData, emptyData } from "@/lib/business";

const VAULT_STORAGE_KEY = "spsa-cobil-vault-v1";
const LEGACY_STORAGE_KEY = "spsa-cobil-data-v2";
const ITERATIONS = 210_000;

export type EncryptedVault = {
  version: 1;
  cipher: "AES-GCM";
  kdf: "PBKDF2-SHA-256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  updatedAt: string;
};

export type VaultBootstrap = { data: AppData; vault: EncryptedVault | null };

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const toBase64 = (value: ArrayBuffer | Uint8Array) => {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let text = "";
  bytes.forEach((byte) => { text += String.fromCharCode(byte); });
  return btoa(text);
};
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

function parseVault(raw: string | null): EncryptedVault | null {
  try {
    const value = raw ? JSON.parse(raw) as EncryptedVault : null;
    return value?.version === 1 && value.cipher === "AES-GCM" && value.kdf === "PBKDF2-SHA-256" && Boolean(value.salt && value.iv && value.ciphertext) ? value : null;
  } catch { return null; }
}

export function getVaultBootstrap(): VaultBootstrap {
  if (typeof window === "undefined") return { data: emptyData(), vault: null };
  const vault = parseVault(window.localStorage.getItem(VAULT_STORAGE_KEY));
  if (vault) return { data: emptyData(), vault };
  try {
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return { data: legacy ? JSON.parse(legacy) as AppData : emptyData(), vault: null };
  } catch { return { data: emptyData(), vault: null }; }
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations = ITERATIONS) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function encrypt(data: AppData, key: CryptoKey, salt: string): Promise<EncryptedVault> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(data)));
  return { version: 1, cipher: "AES-GCM", kdf: "PBKDF2-SHA-256", iterations: ITERATIONS, salt, iv: toBase64(iv), ciphertext: toBase64(ciphertext), updatedAt: new Date().toISOString() };
}

export async function createVault(data: AppData, passphrase: string) {
  if (!crypto?.subtle) throw new Error("Web Crypto indisponible");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const vault = await encrypt(data, key, toBase64(salt));
  return { key, vault };
}

export async function unlockVault(vault: EncryptedVault, passphrase: string) {
  if (!crypto?.subtle) throw new Error("Web Crypto indisponible");
  const key = await deriveKey(passphrase, fromBase64(vault.salt), vault.iterations);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(vault.iv) }, key, fromBase64(vault.ciphertext));
  const data = JSON.parse(decoder.decode(plaintext)) as AppData;
  return { key, data };
}

export async function updateVault(data: AppData, key: CryptoKey, current: EncryptedVault) {
  return encrypt(data, key, current.salt);
}

export function persistVault(vault: EncryptedVault) { window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault)); }
export function removeLegacyData() { window.localStorage.removeItem(LEGACY_STORAGE_KEY); }
export function clearVault() { window.localStorage.removeItem(VAULT_STORAGE_KEY); window.localStorage.removeItem(LEGACY_STORAGE_KEY); }
