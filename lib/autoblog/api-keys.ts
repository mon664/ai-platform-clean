import crypto from 'crypto';

// 암호화 키 (환경 변수로 관리 필수!)
const ENCRYPTION_KEY = process.env.AUTOBLOG_ENCRYPTION_KEY || 'default-32-char-key-change-this!';

/**
 * AES-256-GCM 암호화
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(12); // GCM recommends 12 bytes
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
      iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return format: iv:encrypted:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * AES-256-GCM 복호화
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
      iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * API 키 객체 암호화
 */
export function encryptApiKeys(apiKeys: Record<string, string>): Record<string, string> {
  const encrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(apiKeys)) {
    if (value && typeof value === 'string' && value.trim()) {
      encrypted[key] = encrypt(value);
    }
  }
  return encrypted;
}

/**
 * API 키 객체 복호화
 */
export function decryptApiKeys(encryptedKeys: Record<string, string>): Record<string, string> {
  const decrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(encryptedKeys)) {
    if (value && typeof value === 'string') {
      try {
        decrypted[key] = decrypt(value);
      } catch {
        // If decryption fails, keep original value (for backwards compatibility)
        decrypted[key] = value;
      }
    }
  }
  return decrypted;
}
