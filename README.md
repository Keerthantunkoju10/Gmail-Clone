# ✉️ Gmail Clone &bull; Multi-Account Hub with 16-Digit App Passwords

A modern, authentic **Google Material 3 Gmail Web Client** that interlinks multiple Gmail accounts into a single **Unified Inbox** and connects directly to Gmail servers via **16-character Google App Passwords** using secure IMAP & SMTP.

---

## 🌟 Key Features

1. **Interlinked Multi-Account Architecture**:
   - **Unified Inbox ("All Inboxes")**: Simultaneously merges and chronologically displays incoming emails across all linked accounts with distinct color-coded badges (`Work`, `Personal`, etc.).
   - **Instant Account Switcher**: Authentic Google Account switcher popup in top-right avatar allowing one-click focus on any individual Gmail account or unified mode.
   - **Send As Any Linked Account**: Choose sender identity directly in the Compose modal (`From: [Account Dropdown]`).

2. **16-Digit Google App Password Option**:
   - Clean, auto-formatting input for 16-character App Passwords (`xxxx xxxx xxxx xxxx`).
   - Live character counter (`16/16`).
   - Show/Hide visibility toggle.
   - **"Test Connection"** button: Performs an on-the-fly verification directly with `imap.gmail.com:993` to confirm credentials before adding.
   - Built-in collapsible **Step-by-Step App Password Guide** with direct links to `myaccount.google.com/apppasswords`.

3. **Live Gmail IMAP & SMTP Sync**:
   - **IMAP Retrieval**: Connects to `imap.gmail.com:993` (SSL/TLS) via `imapflow` and `mailparser`.
   - **SMTP Sending**: Delivers actual emails via `smtp.gmail.com:465` (SSL/TLS) via `nodemailer` with attachment support.
   - **Message Actions**: Star/Unstar (`\Flagged`), Mark as Read/Unread (`\Seen`), and Move to Trash (`\Deleted`).

4. **Authentic Google Material 3 Design**:
   - Floating pill Compose button (`+ Compose`) with Gmail pencil icon.
   - Clean pill-shaped Search Bar with real-time subject/sender filtering.
   - Category tabs: Primary, Promotions, Social, Updates.
   - Light and Dark Mode toggle with persistent preference.
   - Responsive sidebar with collapse/expand mode.
   - Floating compose window with minimize, maximize, attachments, and `Ctrl+Enter` shortcut.
   - Full reading pane with sanitized HTML email viewing, headers, and attachment download cards.

5. **Security & Privacy**:
   - **Local AES-256-GCM Encryption**: App Passwords are never stored in plaintext on disk.
   - Zero third-party cloud intermediaries — credentials stay strictly on your local PC.

---

## 🚀 Getting Started

### 1. Start the Application
From the project root:
```bash
cd gmail-clone
npm run dev
```
This runs both the Node.js backend (port `5000`) and the React + Vite frontend (port `5173` or `5174`) concurrently.

Open your browser at:
```
http://localhost:5174/
```

---

## 🔑 How to Generate a 16-Digit Google App Password

1. Visit your **Google Account Security Page**: [myaccount.google.com/security](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON**.
3. Go directly to **App Passwords**: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Enter an app name (e.g. `Gmail Clone`) and click **Create**.
5. Google will display a yellow dialog containing a **16-letter password** (e.g., `abcd efgh ijkl mnop`).
6. Copy that 16-letter code and paste it into the **"Link Gmail Account"** dialog in this clone.
7. Click **"Test Connection"** to verify, then click **"Link & Sync Account"**!

---

## 📁 Project Structure

```
gmail-clone/
├── server/
│   ├── index.js                  # Express API server & routes
│   ├── services/
│   │   ├── accountStore.js       # AES-256 encrypted account storage
│   │   ├── imapService.js        # Gmail IMAP sync with imapflow & mailparser
│   │   ├── smtpService.js        # Gmail SMTP sender with nodemailer
│   │   └── mockData.js           # Preview dataset for demo mode
│   └── data/
│       └── accounts.json         # Locally encrypted accounts file
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx        # Google branding, search, account switcher
│   │   │   ├── Sidebar.jsx       # Compose button, mailboxes, linked accounts
│   │   │   ├── EmailList.jsx     # Action toolbar, tabs, rows with account badges
│   │   │   ├── EmailDetail.jsx   # Full message reader & attachments
│   │   │   ├── AddAccountModal.jsx # 16-digit App Password dialog & test
│   │   │   ├── ComposeModal.jsx  # Floating compose window with sender dropdown
│   │   │   ├── AccountSettingsModal.jsx # Manage & remove accounts
│   │   │   └── AppPasswordGuideModal.jsx # Visual walkthrough guide
│   │   ├── App.jsx               # Master application layout & state
│   │   ├── App.css               # Material 3 styling & animations
│   │   └── index.css             # Theme variables, tokens, resets
│   └── vite.config.js            # Proxy to port 5000
└── package.json                  # Root runner script with concurrently
```
