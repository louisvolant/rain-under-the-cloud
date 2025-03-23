// src/lib/crypto.ts
import CryptoJS from 'crypto-js';

export const encryptContent = (content: string, key: string): string => {
  return CryptoJS.AES.encrypt(content, key).toString();
};

export const decryptContent = (encrypted: string, key: string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Invalid key');
    return decrypted;
  } catch {
    return null;
  }
};