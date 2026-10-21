/**
 * Production API client for Netlify Serverless Backend and Local Development
 * Routes all API requests directly through the Netlify Serverless Function (or local Express server).
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

// Fallback demo accounts for initial empty state before any account is linked
const INITIAL_DEMO_ACCOUNTS = [
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

const AVAILABLE_COLORS = [
  { name: 'Red', hex: '#EA4335', bg: '#FCE8E6', text: '#C5221F' },
  { name: 'Blue', hex: '#1A73E8', bg: '#E8F0FE', text: '#1967D2' },
  { name: 'Green', hex: '#34A853', bg: '#E6F4EA', text: '#137333' },
  { name: 'Yellow', hex: '#FBBC04', bg: '#FEF7E0', text: '#B06000' },
  { name: 'Purple', hex: '#A142F4', bg: '#F3E8FD', text: '#8430CE' },
  { name: 'Teal', hex: '#12B5CB', bg: '#E4F7FB', text: '#007B83' },
];

function getLocalVault() {
  const stored = localStorage.getItem('gmail_clone_local_accounts');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return [];
}

function saveLocalVault(accounts) {
  if (Array.isArray(accounts)) {
    localStorage.setItem('gmail_clone_local_accounts', JSON.stringify(accounts));
  }
}

// Attach local vault headers so Netlify serverless instances can authenticate across cold starts
function getHeaders(customHeaders = {}) {
  const localVault = getLocalVault();
  const headers = { ...customHeaders };
  if (localVault.length > 0) {
    headers['x-accounts'] = JSON.stringify(localVault);
  }
  return headers;
}

export const api = {
  /**
   * Fetch all linked Gmail accounts from the server
   */
  async getAccounts() {
    try {
      const res = await fetch(`${API_BASE}/api/accounts`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        // If server returned accounts, update local vault cache
        if (data.hasRealAccounts && Array.isArray(data.accounts)) {
          saveLocalVault(data.accounts);
        }
        return data;
      }
    } catch (err) {
      console.warn('Network error reaching backend server:', err.message);
    }

    // If completely offline or fresh load with no accounts
    const cached = getLocalVault();
    if (cached.length > 0) {
      return {
        hasRealAccounts: true,
        accounts: cached,
        availableColors: AVAILABLE_COLORS,
      };
    }

    return {
      hasRealAccounts: false,
      accounts: INITIAL_DEMO_ACCOUNTS,
      availableColors: AVAILABLE_COLORS,
    };
  },

  /**
   * Test 16-digit Google App Password directly against Gmail IMAP via Netlify server
   */
  async testAccountCredentials(email, appPassword) {
    const cleanPassword = appPassword.replace(/\s+/g, '').trim();

    try {
      const res = await fetch(`${API_BASE}/api/accounts/test`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email, appPassword: cleanPassword }),
      });

      // Always parse server response whether 200 or 400
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Server test error:', err);
      return {
        success: false,
        error: `Could not reach server: ${err.message}. Please check your connection.`,
      };
    }
  },

  /**
   * Add a new Gmail account using 16-character App Password
   */
  async addAccount(accountData) {
    const res = await fetch(`${API_BASE}/api/accounts`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(accountData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to save account');
    }

    // Save added account to client vault
    if (data.account) {
      const currentVault = getLocalVault().filter(a => a.id !== data.account.id && !a.isDemo);
      currentVault.push(data.account);
      saveLocalVault(currentVault);
    }

    return data;
  },

  /**
   * Remove a linked account
   */
  async deleteAccount(id) {
    // Remove from local cache immediately
    const filtered = getLocalVault().filter(a => a.id !== id);
    saveLocalVault(filtered);

    try {
      const res = await fetch(`${API_BASE}/api/accounts/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend delete request failed:', e.message);
    }
    return { success: true };
  },

  /**
   * Set primary default account
   */
  async setDefaultAccount(id) {
    const updated = getLocalVault().map(a => ({ ...a, isDefault: a.id === id }));
    saveLocalVault(updated);

    try {
      const res = await fetch(`${API_BASE}/api/accounts/${id}/default`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { success: true };
  },

  /**
   * Fetch messages via IMAP through Netlify server
   */
  async getMessages(folder = 'inbox', accountId = 'all', search = '') {
    const params = new URLSearchParams({
      folder,
      accountId,
      search,
    });

    try {
      const res = await fetch(`${API_BASE}/api/messages?${params.toString()}`, {
        headers: getHeaders(),
      });

      if (res.ok) {
        return await res.json();
      }

      const errData = await res.json();
      throw new Error(errData.error || `HTTP ${res.status}: Failed to fetch messages`);
    } catch (err) {
      console.warn('Server fetch messages error:', err.message);
      throw err;
    }
  },

  /**
   * Fetch full email RFC822 detail and attachments
   */
  async getMessageDetail(accountId, folder, uid) {
    const res = await fetch(`${API_BASE}/api/messages/${accountId}/${folder}/${uid}`, {
      headers: getHeaders(),
    });

    if (res.ok) {
      return await res.json();
    }

    const err = await res.json();
    throw new Error(err.error || `Failed to load message detail`);
  },

  /**
   * Send email via Gmail SMTP using selected account
   */
  async sendMessage(formData) {
    const res = await fetch(`${API_BASE}/api/messages/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to send email via SMTP');
    }

    return data;
  },

  /**
   * Star / Unstar email
   */
  async toggleStar(accountId, folder, uid, isStarred) {
    const res = await fetch(`${API_BASE}/api/messages/star`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ accountId, folder, uid, isStarred }),
    });
    if (res.ok) return await res.json();
    return { success: true, isStarred };
  },

  /**
   * Mark as Read / Unread
   */
  async markRead(accountId, folder, uid, isRead) {
    const res = await fetch(`${API_BASE}/api/messages/read`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ accountId, folder, uid, isRead }),
    });
    if (res.ok) return await res.json();
    return { success: true, isRead };
  },

  /**
   * Move email to Trash
   */
  async deleteMessage(accountId, folder, uid) {
    const res = await fetch(`${API_BASE}/api/messages/delete`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ accountId, folder, uid }),
    });
    if (res.ok) return await res.json();
    return { success: true };
  },
};
