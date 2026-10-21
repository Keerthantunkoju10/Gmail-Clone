const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { accountStore, formatAppPassword, normalizeAppPassword, ACCOUNT_COLORS } = require('./services/accountStore');
const {
  testCredentials,
  fetchMessagesForAccount,
  fetchMessageDetail,
  toggleStar,
  markRead,
  moveToTrash,
} = require('./services/imapService');
const { sendEmail } = require('./services/smtpService');
const { DEMO_ACCOUNTS, DEMO_MESSAGES } = require('./services/mockData');

const app = express();
const PORT = process.env.PORT || 5000;

// Multer storage for attachments in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max Gmail attachment limit
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory cache for demo messages so user can star/read/delete demo emails too
let liveDemoMessages = [...DEMO_MESSAGES];

// Helper to determine if an ID belongs to a demo account
function isDemoAccountId(id) {
  return id && id.startsWith('demo-');
}

/* =========================================================
   ACCOUNTS ROUTES
   ========================================================= */

// GET /api/accounts - List all linked accounts
app.get('/api/accounts', (req, res) => {
  try {
    const realAccounts = accountStore.getSafeAccounts();
    if (realAccounts.length === 0) {
      return res.json({
        hasRealAccounts: false,
        accounts: DEMO_ACCOUNTS,
        availableColors: ACCOUNT_COLORS,
      });
    }
    return res.json({
      hasRealAccounts: true,
      accounts: realAccounts,
      availableColors: ACCOUNT_COLORS,
    });
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Failed to load accounts' });
  }
});

// POST /api/accounts/test - Test credentials before adding
app.post('/api/accounts/test', async (req, res) => {
  const { email, appPassword } = req.body;
  if (!email || !appPassword) {
    return res.status(400).json({ success: false, error: 'Email and 16-character App Password are required' });
  }

  const cleanPassword = normalizeAppPassword(appPassword);
  if (cleanPassword.length !== 16) {
    return res.status(400).json({
      success: false,
      error: `Google App Password must be exactly 16 characters (received ${cleanPassword.length}). Format: xxxx xxxx xxxx xxxx`,
    });
  }

  try {
    const result = await testCredentials(email.trim(), cleanPassword);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/accounts - Add or update a Gmail account
app.post('/api/accounts', async (req, res) => {
  const { email, name, appPassword, colorHex, skipVerify } = req.body;
  if (!email || !appPassword) {
    return res.status(400).json({ error: 'Email and 16-character App Password are required' });
  }

  const cleanPassword = normalizeAppPassword(appPassword);
  if (cleanPassword.length !== 16) {
    return res.status(400).json({
      error: `Google App Password must be exactly 16 characters (received ${cleanPassword.length})`,
    });
  }

  // Verify connection with Gmail IMAP unless explicitly skipped
  if (!skipVerify) {
    const verifyResult = await testCredentials(email.trim(), cleanPassword);
    if (!verifyResult.success) {
      return res.status(400).json({
        error: `Could not connect to Gmail: ${verifyResult.error}`,
        needsHelp: true,
      });
    }
  }

  try {
    const saved = accountStore.addAccount({
      email: email.trim(),
      name: name?.trim(),
      appPassword: cleanPassword,
      colorHex,
    });
    res.json({ success: true, account: saved });
  } catch (err) {
    console.error('Error saving account:', err);
    res.status(500).json({ error: err.message || 'Failed to save account' });
  }
});

// DELETE /api/accounts/:id - Remove linked account
app.delete('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  if (isDemoAccountId(id)) {
    return res.json({ success: true, message: 'Demo account dismissed' });
  }

  const deleted = accountStore.deleteAccount(id);
  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Account not found' });
  }
});

// POST /api/accounts/:id/default - Set as primary default account
app.post('/api/accounts/:id/default', (req, res) => {
  const { id } = req.params;
  const updated = accountStore.setDefaultAccount(id);
  res.json({ success: updated });
});

/* =========================================================
   MESSAGES ROUTES
   ========================================================= */

// GET /api/messages - Fetch messages for unified or specific account
app.get('/api/messages', async (req, res) => {
  const { folder = 'inbox', accountId = 'all', limit = 30, search = '' } = req.query;

  try {
    const realAccounts = accountStore.getAllAccountsWithAuth();

    // If no real accounts, serve demo messages
    if (realAccounts.length === 0) {
      let filtered = liveDemoMessages;
      if (accountId && accountId !== 'all') {
        filtered = filtered.filter(m => m.accountId === accountId);
      }
      if (folder && folder !== 'all') {
        if (folder === 'starred') {
          filtered = filtered.filter(m => m.isStarred);
        } else {
          filtered = filtered.filter(m => m.folder.toLowerCase() === folder.toLowerCase());
        }
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(m =>
          m.subject.toLowerCase().includes(q) ||
          m.from.name.toLowerCase().includes(q) ||
          m.from.address.toLowerCase().includes(q) ||
          m.snippet.toLowerCase().includes(q)
        );
      }
      return res.json({
        isDemo: true,
        count: filtered.length,
        messages: filtered,
      });
    }

    // Real accounts handling
    let targetAccounts = [];
    if (accountId === 'all') {
      targetAccounts = realAccounts;
    } else {
      const single = realAccounts.find(a => a.id === accountId);
      if (single) {
        targetAccounts = [single];
      } else {
        return res.status(404).json({ error: 'Target account not found' });
      }
    }

    // Fetch in parallel across accounts
    const fetchPromises = targetAccounts.map(acc =>
      fetchMessagesForAccount(acc, folder, Math.min(Number(limit) || 30, 40))
        .catch(err => {
          console.error(`Fetch failed for account ${acc.email}:`, err.message);
          return [];
        })
    );

    const results = await Promise.all(fetchPromises);
    let combined = results.flat();

    // Sort descending by date
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply search filter if present
    if (search) {
      const q = search.toLowerCase();
      combined = combined.filter(m =>
        m.subject.toLowerCase().includes(q) ||
        m.from.name.toLowerCase().includes(q) ||
        m.from.address.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q)
      );
    }

    res.json({
      isDemo: false,
      count: combined.length,
      messages: combined,
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages: ' + err.message });
  }
});

// GET /api/messages/:accountId/:folder/:uid - Get full message details
app.get('/api/messages/:accountId/:folder/:uid', async (req, res) => {
  const { accountId, folder, uid } = req.params;

  if (isDemoAccountId(accountId)) {
    const found = liveDemoMessages.find(m => m.accountId === accountId && String(m.uid) === String(uid));
    if (found) {
      return res.json(found);
    }
    return res.status(404).json({ error: 'Demo message not found' });
  }

  const account = accountStore.getAccount(accountId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  try {
    const detail = await fetchMessageDetail(account, folder, uid);
    res.json(detail);
  } catch (err) {
    console.error('Error fetching message details:', err);
    res.status(500).json({ error: 'Failed to read message details: ' + err.message });
  }
});

// POST /api/messages/send - Send an email (with optional attachments)
app.post('/api/messages/send', upload.array('attachments', 10), async (req, res) => {
  const { accountId, to, cc, bcc, subject, text, html, inReplyTo, references } = req.body;

  if (!accountId || !to) {
    return res.status(400).json({ error: 'Account ID and recipient (To) are required' });
  }

  // Format attachments for nodemailer
  const attachments = (req.files || []).map(file => ({
    filename: file.originalname,
    content: file.buffer,
    contentType: file.mimetype,
  }));

  // Demo account mock sending
  if (isDemoAccountId(accountId)) {
    const demoAcc = DEMO_ACCOUNTS.find(a => a.id === accountId) || DEMO_ACCOUNTS[0];
    const newSentMsg = {
      id: `demo-sent-${Date.now()}`,
      uid: Date.now(),
      folder: 'sent',
      subject: subject || '(no subject)',
      from: { name: demoAcc.name, address: demoAcc.email },
      to: { name: '', address: to },
      date: new Date().toISOString(),
      snippet: text ? text.substring(0, 100) : (html ? html.replace(/<[^>]+>/g, '').substring(0, 100) : ''),
      isStarred: false,
      isRead: true,
      hasAttachments: attachments.length > 0,
      accountId: demoAcc.id,
      accountEmail: demoAcc.email,
      accountName: demoAcc.name,
      accountColor: demoAcc.color,
      html: html || `<p>${text || ''}</p>`,
      text: text || '',
      attachments: attachments.map(a => ({ filename: a.filename, size: a.content.length, contentType: a.contentType })),
    };
    liveDemoMessages.unshift(newSentMsg);
    return res.json({ success: true, messageId: `<mock-${Date.now()}@gmail.com>`, isDemo: true });
  }

  // Real account sending
  const account = accountStore.getAccount(accountId);
  if (!account) {
    return res.status(404).json({ error: 'Sending account not found' });
  }

  try {
    const sendResult = await sendEmail(account, {
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments,
      inReplyTo,
      references,
    });
    res.json(sendResult);
  } catch (err) {
    console.error('SMTP sending error:', err);
    res.status(500).json({ error: 'Failed to send email: ' + err.message });
  }
});

// POST /api/messages/star - Toggle Star
app.post('/api/messages/star', async (req, res) => {
  const { accountId, folder = 'inbox', uid, isStarred } = req.body;

  if (isDemoAccountId(accountId)) {
    const found = liveDemoMessages.find(m => m.accountId === accountId && String(m.uid) === String(uid));
    if (found) {
      found.isStarred = Boolean(isStarred);
      return res.json({ success: true, isStarred: found.isStarred });
    }
  }

  const account = accountStore.getAccount(accountId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  try {
    const result = await toggleStar(account, folder, uid, isStarred);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update star: ' + err.message });
  }
});

// POST /api/messages/read - Toggle Read/Unread
app.post('/api/messages/read', async (req, res) => {
  const { accountId, folder = 'inbox', uid, isRead } = req.body;

  if (isDemoAccountId(accountId)) {
    const found = liveDemoMessages.find(m => m.accountId === accountId && String(m.uid) === String(uid));
    if (found) {
      found.isRead = Boolean(isRead);
      return res.json({ success: true, isRead: found.isRead });
    }
  }

  const account = accountStore.getAccount(accountId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  try {
    const result = await markRead(account, folder, uid, isRead);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark read: ' + err.message });
  }
});

// POST /api/messages/delete - Move to Trash
app.post('/api/messages/delete', async (req, res) => {
  const { accountId, folder = 'inbox', uid } = req.body;

  if (isDemoAccountId(accountId)) {
    const index = liveDemoMessages.findIndex(m => m.accountId === accountId && String(m.uid) === String(uid));
    if (index >= 0) {
      liveDemoMessages[index].folder = 'trash';
      return res.json({ success: true });
    }
  }

  const account = accountStore.getAccount(accountId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  try {
    const result = await moveToTrash(account, folder, uid);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message: ' + err.message });
  }
});

/* =========================================================
   SERVER STARTUP
   ========================================================= */

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Gmail Clone Backend Server running on port ${PORT}`);
  console.log(` IMAP host: imap.gmail.com:993 (SSL/TLS)`);
  console.log(` SMTP host: smtp.gmail.com:465 (SSL/TLS)`);
  console.log(`===============================================`);
});
