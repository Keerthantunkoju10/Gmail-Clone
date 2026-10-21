const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

// Map generic folder names to Gmail IMAP paths
const GMAIL_FOLDER_MAP = {
  inbox: 'INBOX',
  sent: '[Gmail]/Sent Mail',
  starred: '[Gmail]/Starred',
  drafts: '[Gmail]/Drafts',
  trash: '[Gmail]/Trash',
  spam: '[Gmail]/Spam',
  all: '[Gmail]/All Mail',
};

// Create an ImapFlow client instance
function createClient(email, password) {
  return new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: email,
      pass: password,
    },
    logger: false, // Set to true if deep debugging needed
    emitLogs: false,
    clientInfo: {
      name: 'GmailClone',
      version: '1.0.0',
    },
  });
}

/**
 * Test whether the provided Gmail email and 16-character app password are valid.
 */
async function testCredentials(email, appPassword) {
  const client = createClient(email, appPassword);
  try {
    await client.connect();
    // Test listing mailboxes
    await client.mailboxOpen('INBOX', { readOnly: true });
    await client.logout();
    return { success: true };
  } catch (err) {
    let message = err.message || 'Connection failed';
    if (message.includes('Invalid credentials') || message.includes('AUTHENTICATIONFAILED')) {
      message = 'Invalid Gmail credentials. Ensure 2-Step Verification is ON and you generated a 16-digit App Password at myaccount.google.com/apppasswords.';
    }
    return { success: false, error: message };
  }
}

/**
 * Resolve Gmail folder path dynamically
 */
async function resolveFolderPath(client, folderName) {
  const lower = (folderName || 'inbox').toLowerCase();
  if (GMAIL_FOLDER_MAP[lower]) {
    return GMAIL_FOLDER_MAP[lower];
  }

  // Check existing mailboxes for match (handling locale variants like [Gmail]/Bin instead of [Gmail]/Trash)
  try {
    const list = await client.list();
    if (lower === 'trash' || lower === 'bin') {
      const trashBox = list.find(m => m.specialUse === '\\Trash' || m.path.includes('Trash') || m.path.includes('Bin'));
      if (trashBox) return trashBox.path;
    }
    if (lower === 'sent') {
      const sentBox = list.find(m => m.specialUse === '\\Sent' || m.path.includes('Sent'));
      if (sentBox) return sentBox.path;
    }
    if (lower === 'starred' || lower === 'flagged') {
      const starBox = list.find(m => m.specialUse === '\\Flagged' || m.path.includes('Starred'));
      if (starBox) return starBox.path;
    }
  } catch (e) {
    // fallback
  }

  return GMAIL_FOLDER_MAP[lower] || 'INBOX';
}

/**
 * Fetch messages for a specific account and folder
 */
async function fetchMessagesForAccount(account, folder = 'inbox', limit = 30) {
  const client = createClient(account.email, account.appPassword);
  try {
    await client.connect();
    const folderPath = await resolveFolderPath(client, folder);
    const mailbox = await client.mailboxOpen(folderPath, { readOnly: true });

    if (mailbox.exists === 0) {
      await client.logout();
      return [];
    }

    // Determine sequence range to get latest messages first
    const total = mailbox.exists;
    const start = Math.max(1, total - limit + 1);
    const range = `${start}:${total}`;

    const messages = [];

    // Fetch envelope, flags, uid, internalDate
    for await (let msg of client.fetch(range, { envelope: true, flags: true, uid: true, internalDate: true, bodyStructure: true })) {
      const env = msg.envelope || {};
      const fromObj = (env.from && env.from[0]) ? env.from[0] : { name: 'Unknown', address: 'unknown@gmail.com' };
      const toObj = (env.to && env.to[0]) ? env.to[0] : { name: '', address: '' };

      const isStarred = msg.flags ? msg.flags.has('\\Flagged') : false;
      const isRead = msg.flags ? msg.flags.has('\\Seen') : false;

      // Check attachments
      let hasAttachments = false;
      if (msg.bodyStructure && msg.bodyStructure.childNodes) {
        hasAttachments = msg.bodyStructure.childNodes.some(part => part.disposition === 'attachment');
      }

      messages.push({
        id: `${account.id}-${msg.uid}`,
        uid: msg.uid,
        seq: msg.seq,
        folder: folder,
        subject: env.subject || '(no subject)',
        from: {
          name: fromObj.name || fromObj.address.split('@')[0],
          address: fromObj.address,
        },
        to: {
          name: toObj.name || '',
          address: toObj.address || '',
        },
        date: msg.internalDate ? new Date(msg.internalDate).toISOString() : (env.date ? new Date(env.date).toISOString() : new Date().toISOString()),
        snippet: env.subject || '', // Basic preview snippet
        isStarred,
        isRead,
        hasAttachments,
        accountId: account.id,
        accountEmail: account.email,
        accountName: account.name,
        accountColor: account.color,
      });
    }

    await client.logout();
    // Return newest first
    return messages.reverse();
  } catch (err) {
    console.error(`Error fetching messages for ${account.email}:`, err.message);
    try { await client.logout(); } catch (e) {}
    throw err;
  }
}

/**
 * Fetch full message content (HTML, text, attachments) by UID
 */
async function fetchMessageDetail(account, folder = 'inbox', uid) {
  const client = createClient(account.email, account.appPassword);
  try {
    await client.connect();
    const folderPath = await resolveFolderPath(client, folder);
    await client.mailboxOpen(folderPath, { readOnly: true });

    const messageData = await client.download(Number(uid), ['RFC822']);
    if (!messageData || !messageData.content) {
      throw new Error('Message content not found');
    }

    const parsed = await simpleParser(messageData.content);

    await client.logout();

    return {
      uid: Number(uid),
      accountId: account.id,
      accountEmail: account.email,
      accountName: account.name,
      accountColor: account.color,
      subject: parsed.subject || '(no subject)',
      from: {
        name: parsed.from?.value?.[0]?.name || parsed.from?.text || '',
        address: parsed.from?.value?.[0]?.address || '',
      },
      to: parsed.to?.value?.map(t => ({ name: t.name || '', address: t.address || '' })) || [],
      cc: parsed.cc?.value?.map(c => ({ name: c.name || '', address: c.address || '' })) || [],
      date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
      html: parsed.html || parsed.textAsHtml || null,
      text: parsed.text || '',
      attachments: (parsed.attachments || []).map(att => ({
        filename: att.filename || 'attachment',
        contentType: att.contentType,
        size: att.size,
        contentId: att.contentId,
        // If small, base64 embed or download endpoint
        base64: att.size < 5 * 1024 * 1024 ? `data:${att.contentType};base64,${att.content.toString('base64')}` : null,
      })),
      headers: {
        messageId: parsed.messageId,
        inReplyTo: parsed.inReplyTo,
        references: parsed.references,
      },
    };
  } catch (err) {
    console.error(`Error fetching message detail for ${account.email} UID ${uid}:`, err.message);
    try { await client.logout(); } catch (e) {}
    throw err;
  }
}

/**
 * Toggle Star / Flag on a message
 */
async function toggleStar(account, folder = 'inbox', uid, isStarred) {
  const client = createClient(account.email, account.appPassword);
  try {
    await client.connect();
    const folderPath = await resolveFolderPath(client, folder);
    await client.mailboxOpen(folderPath, { readOnly: false });

    if (isStarred) {
      await client.messageFlagsAdd({ uid: Number(uid) }, ['\\Flagged'], { uid: true });
    } else {
      await client.messageFlagsRemove({ uid: Number(uid) }, ['\\Flagged'], { uid: true });
    }

    await client.logout();
    return { success: true, isStarred };
  } catch (err) {
    try { await client.logout(); } catch (e) {}
    throw err;
  }
}

/**
 * Mark message as Read / Unread
 */
async function markRead(account, folder = 'inbox', uid, isRead) {
  const client = createClient(account.email, account.appPassword);
  try {
    await client.connect();
    const folderPath = await resolveFolderPath(client, folder);
    await client.mailboxOpen(folderPath, { readOnly: false });

    if (isRead) {
      await client.messageFlagsAdd({ uid: Number(uid) }, ['\\Seen'], { uid: true });
    } else {
      await client.messageFlagsRemove({ uid: Number(uid) }, ['\\Seen'], { uid: true });
    }

    await client.logout();
    return { success: true, isRead };
  } catch (err) {
    try { await client.logout(); } catch (e) {}
    throw err;
  }
}

/**
 * Move message to Trash
 */
async function moveToTrash(account, folder = 'inbox', uid) {
  const client = createClient(account.email, account.appPassword);
  try {
    await client.connect();
    const folderPath = await resolveFolderPath(client, folder);
    const trashPath = await resolveFolderPath(client, 'trash');
    await client.mailboxOpen(folderPath, { readOnly: false });

    await client.messageMove({ uid: Number(uid) }, trashPath, { uid: true });

    await client.logout();
    return { success: true };
  } catch (err) {
    try { await client.logout(); } catch (e) {}
    throw err;
  }
}

module.exports = {
  testCredentials,
  fetchMessagesForAccount,
  fetchMessageDetail,
  toggleStar,
  markRead,
  moveToTrash,
  GMAIL_FOLDER_MAP,
};
