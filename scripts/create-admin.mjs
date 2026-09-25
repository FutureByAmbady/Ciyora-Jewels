import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { webcrypto } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const cryptoApi = globalThis.crypto || webcrypto;
const args = process.argv.slice(2);
const flag = name => args[args.indexOf(name) + 1];
const email = String(flag('--email') || '').trim().toLowerCase();
const displayName = String(flag('--name') || 'Ciyora Admin').trim();
if (!email || !email.includes('@')) {
    console.error('Usage: node scripts/create-admin.mjs --email admin@example.com --name "Ciyora Admin"');
    process.exit(1);
}

const rl = createInterface({ input, output });
const password = await rl.question('Choose an admin password (12+ characters; input may be visible in some terminals): ');
const confirmation = await rl.question('Confirm password: ');
rl.close();
if (password.length < 12 || password !== confirmation) {
    console.error('Passwords must match and be at least 12 characters.');
    process.exit(1);
}

const salt = cryptoApi.getRandomValues(new Uint8Array(16));
const key = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
const iterations = 100000;
const bits = await cryptoApi.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
const hex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const sql = value => `'${String(value).replaceAll("'", "''")}'`;
const filename = 'admin-user.sql';
const content = `INSERT INTO admin_users (email, display_name, password_hash, password_salt, password_iterations) VALUES (${sql(email)}, ${sql(displayName)}, ${sql(hex(bits))}, ${sql(hex(salt))}, ${iterations}) ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, password_hash = excluded.password_hash, password_salt = excluded.password_salt, password_iterations = excluded.password_iterations, is_active = 1, updated_at = datetime('now');\n`;
await writeFile(filename, content, 'utf8');
console.log(`Created ${filename}. Apply it with: npx wrangler d1 execute ciyora-jewels --remote --file=${filename}`);
console.log('Delete admin-user.sql after applying it. The plaintext password was not written to the file.');
