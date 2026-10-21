/**
 * Centralized API service with support for:
 * 1. Netlify Serverless Functions (auto-routed via /.netlify/functions/api)
 * 2. Local Vite proxy (/api) when running locally
 * 3. Client-assisted stateless persistence across Serverless cold starts
 * 4. Client-side fallback mode when offline
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

// Fallback demo dataset for initial preview
const FALLBACK_ACCOUNTS = [
  {
    id: 'demo-work',
    email: 'alex.work@gmail.com',
    name: 'Alex Work',
    color: { name: 'Blue', hex: '#1A73E8', bg: '#E8F0FE', text: '#1967D2' },
    isDefault: true,
    isDemo: true,
    initial: 'W',
    unreadCount: 2,
  },
  {
    id: 'demo-personal',
    email: 'alex.personal@gmail.com',
    name: 'Alex Personal',
    color: { name: 'Green', hex: '#34A853', bg: '#E6F4EA', text: '#137333' },
    isDefault: false,
    isDemo: true,
    initial: 'P',
    unreadCount: 1,
  },
];

const FALLBACK_MESSAGES = [
  {
    id: 'demo-msg-1',
    uid: 101,
    folder: 'inbox',
    subject: 'Welcome to your Interlinked Gmail Clone! 🚀',
    from: { name: 'Google Cloud Team', address: 'cloud-updates@google.com' },
    to: { name: 'Alex Work', address: 'alex.work@gmail.com' },
    date: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    snippet: 'Manage all your Gmail accounts in one unified inbox with 16-character Google App Passwords...',
    isStarred: true,
    isRead: false,
    hasAttachments: false,
    accountId: 'demo-work',
    accountEmail: 'alex.work@gmail.com',
    accountName: 'Alex Work',
    accountColor: { name: 'Blue', hex: '#1A73E8', bg: '#E8F0FE', text: '#1967D2' },
    html: `
      <div style="font-family: Roboto, Arial, sans-serif; max-width: 650px; color: #202124; line-height: 1.6;">
        <h2 style="color: #1a73e8; margin-bottom: 8px;">Welcome to your Interlinked Gmail Clone</h2>
        <p>This web client connects seamlessly to Gmail using <strong>16-digit Google App Passwords</strong> over secure IMAP & SMTP.</p>
        <div style="background: #f8f9fa; border-left: 4px solid #1a73e8; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 8px 0; color: #1a73e8;">Key Features Ready for You:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Unified Inbox:</strong> View combined emails from all linked Gmail accounts with account badges.</li>
            <li><strong>Instant Account Switcher:</strong> Switch focus to any specific Gmail account at any time.</li>
            <li><strong>16-Digit App Password Support:</strong> Auto-formatted input (<code>xxxx xxxx xxxx xxxx</code>) with live credential verification.</li>
            <li><strong>Serverless Ready:</strong> Runs natively on Netlify Functions with direct IMAP & SMTP execution.</li>
          </ul>
        </div>
        <p>Click <strong>"Add Account"</strong> in the top right account switcher to link your actual Gmail accounts!</p>
      </div>
    `,
  },
  {
    id: 'demo-msg-2',
    uid: 102,
    folder: 'inbox',
    subject: 'Project roadmap review: Q4 sprint updates and milestones',
    from: { name: 'Sarah Lin', address: 'sarah.lin@techcorp.io' },
    to: { name: 'Alex Work', address: 'alex.work@gmail.com' },
    date: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    snippet: 'Hey Alex, attached is the updated sprint retrospective document. Let me know if you want any revisions before tomorrow...',
    isStarred: false,
    isRead: false,
    hasAttachments: true,
    accountId: 'demo-work',
    accountEmail: 'alex.work@gmail.com',
    accountName: 'Alex Work',
    accountColor: { name: 'Blue', hex: '#1A73E8', bg: '#E8F0FE', text: '#1967D2' },
    html: `
      <div style="font-family: Roboto, Arial, sans-serif; line-height: 1.6; color: #202124;">
        <p>Hi Alex,</p>
        <p>Attached is the updated sprint retrospective document for our Q4 product release.</p>
        <p>Let me know if you want any revisions before tomorrow's team sync.</p>
      </div>
    `,
    attachments: [
      { filename: 'Q4_Roadmap_Final.pdf', size: 142000, contentType: 'application/pdf' },
    ],
  },
  {
    id: 'demo-msg-3',
    uid: 201,
    folder: 'inbox',
    subject: 'Weekend hiking plans at Mount Rainier 🌲',
    from: { name: 'Marcus Brody', address: 'marcus.brody@outdoors.org' },
    to: { name: 'Alex Personal', address: 'alex.personal@gmail.com' },
    date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    snippet: 'Hey, the weather forecast for Saturday looks sunny with crisp 62°F. Trails are open and we have permits ready...',
    isStarred: true,
    isRead: true,
    hasAttachments: false,
    accountId: 'demo-personal',
    accountEmail: 'alex.personal@gmail.com',
    accountName: 'Alex Personal',
    accountColor: { name: 'Green', hex: '#34A853', bg: '#E6F4EA', text: '#137333' },
    html: `
      <div style="font-family: Roboto, Arial, sans-serif; line-height: 1.6; color: #202124;">
        <p>Hey Alex,</p>
        <p>The weather forecast for Saturday looks sunny with crisp 62°F. Trails are fully open and we have the morning permits ready.</p>
      </div>
    `,
  },
];

const AVAILABLE_COLORS = [
  { name: 'Red', hex: '#EA4335', bg: '#FCE8E6', text: '#C5221F' },
  { name: 'Blue', hex: '#1A73E8', bg: '#E8F0FE', text: '#1967D2' },
  { name: 'Green', hex: '#34A853', bg: '#E6F4EA', text: '#137333' },
  { name: 'Yellow', hex: '#FBBC04', bg: '#FEF7E0', text: '#B06000' },
  { name: 'Purple', hex: '#A142F4', bg: '#F3E8FD', text: '#8430CE' },
  { name: 'Teal', hex: '#12B5CB', bg: '#E4F7FB', text: '#007B83' },
];

function getLocalAccounts() {
  const stored = localStorage.getItem('gmail_clone_local_accounts');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return FALLBACK_ACCOUNTS;
}

function saveLocalAccounts(accs) {
  localStorage.setItem('gmail_clone_local_accounts', JSON.stringify(accs));
}

function getLocalMessages() {
  const stored = localStorage.getItem('gmail_clone_local_messages');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return FALLBACK_MESSAGES;
}

function saveLocalMessages(msgs) {
  localStorage.setItem('gmail_clone_local_messages', JSON.stringify(msgs));
}

// Helper to provide headers including stateless accounts vault for Serverless Lambdas
function getHeaders(customHeaders = {}) {
  const local = localStorage.getItem('gmail_clone_local_accounts');
  const headers = { ...customHeaders };
  if (local) {
    headers['x-accounts'] = local;
  }
  return headers;
}

export const api = {
  // Accounts
  async getAccounts() {
    try {
      const res = await fetch(`${API_BASE}/api/accounts`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hasRealAccounts && data.accounts?.length > 0) {
          saveLocalAccounts(data.accounts);
        }
        return data;
      }
    } catch (e) {
      console.warn('Backend unavailable, using client fallback:', e.message);
    }
    return {
      hasRealAccounts: false,
      accounts: getLocalAccounts(),
      availableColors: AVAILABLE_COLORS,
    };
  },

  async testAccountCredentials(email, appPassword) {
    try {
      const res = await fetch(`${API_BASE}/api/accounts/test`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email, appPassword }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable for test:', e.message);
    }
    if (appPassword.replace(/\s+/g, '').length === 16) {
      return { success: true, message: 'Valid 16-character format verified' };
    }
    return { success: false, error: 'App password must be 16 characters' };
  },

  async addAccount(accountData) {
    try {
      const res = await fetch(`${API_BASE}/api/accounts`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(accountData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.account) {
          const current = getLocalAccounts().filter(a => !a.isDemo);
          current.push(data.account);
          saveLocalAccounts(current);
        }
        return data;
      }
      const err = await res.json();
      throw new Error(err.error || 'Failed to save account');
    } catch (e) {
      if (API_BASE) throw e;
      // Local fallback
      const cleanEmail = accountData.email.trim();
      const current = getLocalAccounts().filter(a => !a.isDemo);
      const newAcc = {
        id: `local-${Date.now()}`,
        email: cleanEmail,
        name: accountData.name || cleanEmail.split('@')[0],
        color: AVAILABLE_COLORS.find(c => c.hex === accountData.colorHex) || AVAILABLE_COLORS[0],
        isDefault: current.length === 0,
        initial: (accountData.name || cleanEmail)[0].toUpperCase(),
        unreadCount: 0,
      };
      current.push(newAcc);
      saveLocalAccounts(current);
      return { success: true, account: newAcc };
    }
  },

  async deleteAccount(id) {
    try {
      const res = await fetch(`${API_BASE}/api/accounts/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const filtered = getLocalAccounts().filter(a => a.id !== id);
    saveLocalAccounts(filtered);
    return { success: true };
  },

  async setDefaultAccount(id) {
    try {
      const res = await fetch(`${API_BASE}/api/accounts/${id}/default`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const accs = getLocalAccounts().map(a => ({ ...a, isDefault: a.id === id }));
    saveLocalAccounts(accs);
    return { success: true };
  },

  // Messages
  async getMessages(folder = 'inbox', accountId = 'all', search = '') {
    try {
      const params = new URLSearchParams({ folder, accountId, search });
      const res = await fetch(`${API_BASE}/api/messages?${params.toString()}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    let msgs = getLocalMessages();
    if (accountId && accountId !== 'all') {
      msgs = msgs.filter(m => m.accountId === accountId);
    }
    if (folder && folder !== 'all') {
      if (folder === 'starred') msgs = msgs.filter(m => m.isStarred);
      else msgs = msgs.filter(m => m.folder === folder);
    }
    if (search) {
      const q = search.toLowerCase();
      msgs = msgs.filter(m =>
        m.subject.toLowerCase().includes(q) ||
        m.from.name.toLowerCase().includes(q) ||
        m.from.address.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q)
      );
    }
    return { count: msgs.length, messages: msgs };
  },

  async getMessageDetail(accountId, folder, uid) {
    try {
      const res = await fetch(`${API_BASE}/api/messages/${accountId}/${folder}/${uid}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const msgs = getLocalMessages();
    const found = msgs.find(m => m.accountId === accountId && String(m.uid) === String(uid));
    if (found) return found;
    throw new Error('Message not found');
  },

  async sendMessage(formData) {
    try {
      const res = await fetch(`${API_BASE}/api/messages/send`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });
      if (res.ok) return await res.json();
      const err = await res.json();
      throw new Error(err.error || 'Failed to send');
    } catch (e) {
      if (API_BASE) throw e;
      return { success: true, messageId: `<mock-${Date.now()}@gmail.com>` };
    }
  },

  async toggleStar(accountId, folder, uid, isStarred) {
    try {
      await fetch(`${API_BASE}/api/messages/star`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ accountId, folder, uid, isStarred }),
      });
    } catch (e) {}
    const msgs = getLocalMessages().map(m =>
      m.accountId === accountId && String(m.uid) === String(uid)
        ? { ...m, isStarred }
        : m
    );
    saveLocalMessages(msgs);
    return { success: true, isStarred };
  },

  async markRead(accountId, folder, uid, isRead) {
    try {
      await fetch(`${API_BASE}/api/messages/read`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ accountId, folder, uid, isRead }),
      });
    } catch (e) {}
    const msgs = getLocalMessages().map(m =>
      m.accountId === accountId && String(m.uid) === String(uid)
        ? { ...m, isRead }
        : m
    );
    saveLocalMessages(msgs);
    return { success: true, isRead };
  },

  async deleteMessage(accountId, folder, uid) {
    try {
      await fetch(`${API_BASE}/api/messages/delete`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ accountId, folder, uid }),
      });
    } catch (e) {}
    const msgs = getLocalMessages().filter(m => !(m.accountId === accountId && String(m.uid) === String(uid)));
    saveLocalMessages(msgs);
    return { success: true };
  },
};
