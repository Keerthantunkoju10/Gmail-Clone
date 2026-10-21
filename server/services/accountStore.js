const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Master encryption key derived from environment or machine unique key
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'gmail-clone-secure-master-salt-2026';
const KEY = crypto.scryptSync(ENCRYPTION_SECRET, 'gmail-clone-salt', 32);
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedText) {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;
    const [ivHex, authTagHex, cipherText] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt password:', err.message);
    return '';
  }
}

// Default initial color palette for accounts
const ACCOUNT_COLORS = [
  { name: 'Red', hex: '#EA4335', bg: '#FCE8E6', text: '#C5221F' },
  { name: 'Blue', hex: '#1A73E8', bg: '#E8F0FE', text: '#1967D2' },
  { name: 'Green', hex: '#34A853', bg: '#E6F4EA', text: '#137333' },
  { name: 'Yellow', hex: '#FBBC04', bg: '#FEF7E0', text: '#B06000' },
  { name: 'Purple', hex: '#A142F4', bg: '#F3E8FD', text: '#8430CE' },
  { name: 'Teal', hex: '#12B5CB', bg: '#E4F7FB', text: '#007B83' },
];

function readRawAccounts() {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    console.error('Error reading accounts file:', e);
    return [];
  }
}

function writeRawAccounts(accounts) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8');
}

/**
 * Clean and format 16-character App Password (removes spaces, ensures lowercase/uppercase trimmed)
 */
function normalizeAppPassword(rawPassword) {
  if (!rawPassword) return '';
  return rawPassword.replace(/\s+/g, '').trim();
}

/**
 * Format 16-character password into 4x4 display (xxxx xxxx xxxx xxxx)
 */
function formatAppPassword(cleanPassword) {
  if (!cleanPassword || cleanPassword.length !== 16) return cleanPassword;
  return cleanPassword.match(/.{1,4}/g).join(' ');
}

class AccountStore {
  // Returns safe accounts list without raw passwords
  getSafeAccounts() {
    const raw = readRawAccounts();
    return raw.map(acc => ({
      id: acc.id,
      email: acc.email,
      name: acc.name || acc.email.split('@')[0],
      color: acc.color || ACCOUNT_COLORS[0],
      createdAt: acc.createdAt,
      isDefault: !!acc.isDefault,
      status: acc.status || 'active',
      unreadCount: acc.unreadCount || 0,
      initial: (acc.name || acc.email)[0].toUpperCase(),
    }));
  }

  // Returns full account with decrypted password for backend sync
  getAccount(id) {
    const raw = readRawAccounts();
    const acc = raw.find(a => a.id === id);
    if (!acc) return null;
    return {
      ...acc,
      appPassword: decrypt(acc.encryptedPassword),
    };
  }

  getAllAccountsWithAuth() {
    const raw = readRawAccounts();
    return raw.map(acc => ({
      ...acc,
      appPassword: decrypt(acc.encryptedPassword),
    }));
  }

  addAccount({ email, name, appPassword, colorHex }) {
    const raw = readRawAccounts();
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = normalizeAppPassword(appPassword);

    if (cleanPassword.length !== 16) {
      throw new Error(`Gmail App Password must be exactly 16 characters (received ${cleanPassword.length} characters)`);
    }

    const existingIndex = raw.findIndex(a => a.email.toLowerCase() === cleanEmail);
    const chosenColor = ACCOUNT_COLORS.find(c => c.hex === colorHex) || 
      ACCOUNT_COLORS[raw.length % ACCOUNT_COLORS.length];

    const encryptedPassword = encrypt(cleanPassword);
    const id = existingIndex >= 0 ? raw[existingIndex].id : uuidv4();

    const accountObj = {
      id,
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split('@')[0],
      encryptedPassword,
      color: chosenColor,
      isDefault: raw.length === 0,
      createdAt: existingIndex >= 0 ? raw[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    };

    if (existingIndex >= 0) {
      raw[existingIndex] = accountObj;
    } else {
      raw.push(accountObj);
    }

    writeRawAccounts(raw);

    return {
      id: accountObj.id,
      email: accountObj.email,
      name: accountObj.name,
      color: accountObj.color,
      isDefault: accountObj.isDefault,
    };
  }

  deleteAccount(id) {
    const raw = readRawAccounts();
    const filtered = raw.filter(a => a.id !== id);
    if (filtered.length !== raw.length) {
      // If deleted account was default, assign default to first remaining
      if (filtered.length > 0 && !filtered.some(a => a.isDefault)) {
        filtered[0].isDefault = true;
      }
      writeRawAccounts(filtered);
      return true;
    }
    return false;
  }

  setDefaultAccount(id) {
    const raw = readRawAccounts();
    let updated = false;
    for (const a of raw) {
      if (a.id === id) {
        a.isDefault = true;
        updated = true;
      } else {
        a.isDefault = false;
      }
    }
    if (updated) {
      writeRawAccounts(raw);
    }
    return updated;
  }
}

module.exports = {
  accountStore: new AccountStore(),
  ACCOUNT_COLORS,
  normalizeAppPassword,
  formatAppPassword,
};
