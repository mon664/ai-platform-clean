import { sql } from '@vercel/postgres';
import crypto from 'crypto';

const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32);

function decrypt(payload: string): string {
  const [ivHex, dataHex] = payload.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export async function loadApiKeys(): Promise<Record<string, string>> {
  try {
    const result = await sql`
      SELECT key_name, encrypted_value
      FROM auto_blog_api_keys
    `;

    const apiKeys: Record<string, string> = {};
    result.rows.forEach(row => {
      try {
        apiKeys[row.key_name] = row.encrypted_value ? decrypt(row.encrypted_value) : '';
      } catch {
        // ignore bad entries
        apiKeys[row.key_name] = '';
      }
    });

    return apiKeys;
  } catch (error) {
    console.error('Failed to load API keys:', error);
    return {};
  }
}

export async function getApiKey(name: 'openai' | 'anthropic' | 'gemini' | 'stabilityai'): Promise<string | undefined> {
  try {
    const result = await sql`
      SELECT encrypted_value
      FROM auto_blog_api_keys
      WHERE key_name = ${name}
    `;

    if (result.rows.length > 0) {
      return decrypt(result.rows[0].encrypted_value);
    }

    return undefined;
  } catch (error) {
    console.error(`Failed to get API key for ${name}:`, error);
    return undefined;
  }
}

export async function saveApiKeys(apiKeys: Record<string, string>): Promise<void> {
  try {
    const encrypt = (text: string): string => {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
      const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
      return iv.toString('hex') + ':' + encrypted.toString('hex');
    };

    for (const [keyName, value] of Object.entries(apiKeys)) {
      if (typeof value === 'string' && value.trim()) {
        const encrypted = encrypt(value);

        await sql`
          INSERT INTO auto_blog_api_keys (key_name, encrypted_value, updated_at)
          VALUES (${keyName}, ${encrypted}, NOW())
          ON CONFLICT (key_name)
          DO UPDATE SET
            encrypted_value = ${encrypted},
            updated_at = NOW()
        `;
      }
    }
  } catch (error) {
    console.error('Failed to save API keys:', error);
    throw error;
  }
}

export async function deleteApiKey(name: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM auto_blog_api_keys WHERE key_name = ${name}
    `;
    return result.rowCount > 0;
  } catch (error) {
    console.error('Failed to delete API key:', error);
    throw error;
  }
}
