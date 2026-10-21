import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import AddAccountModal from './components/AddAccountModal';
import ComposeModal from './components/ComposeModal';
import AccountSettingsModal from './components/AccountSettingsModal';
import AppPasswordGuideModal from './components/AppPasswordGuideModal';
import { api } from './services/api';
import './App.css';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gmail_clone_theme') || 'light';
  });

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Accounts state
  const [accounts, setAccounts] = useState([]);
  const [hasRealAccounts, setHasRealAccounts] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState('all'); // 'all' = Unified Inbox

  // Navigation & Mailbox
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');

  // Messages state
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Modals state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [composeInitialData, setComposeInitialData] = useState({});

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('gmail_clone_theme', next);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load Accounts
  const loadAccounts = useCallback(async () => {
    try {
      const data = await api.getAccounts();
      setAccounts(data.accounts || []);
      setHasRealAccounts(data.hasRealAccounts);
      setAvailableColors(data.availableColors || []);

      // If activeAccountId doesn't exist anymore, reset to 'all'
      if (activeAccountId !== 'all' && !data.accounts?.some((a) => a.id === activeAccountId)) {
        setActiveAccountId('all');
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }, [activeAccountId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Fetch Messages
  const fetchMessages = useCallback(async () => {
    setIsLoadingMessages(true);
    try {
      const data = await api.getMessages(activeFolder, activeAccountId, searchQuery);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      showToast('Failed to fetch messages from IMAP', 'error');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeFolder, activeAccountId, searchQuery]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Account Added Callback
  const handleAccountAdded = (newAccount) => {
    showToast(`Gmail account ${newAccount.email} linked successfully!`, 'success');
    loadAccounts();
    setActiveAccountId(newAccount.id);
  };

  // Remove Account Callback
  const handleRemoveAccount = async (id) => {
    if (!window.confirm('Are you sure you want to remove this linked Gmail account?')) return;
    try {
      await api.deleteAccount(id);
      showToast('Account removed', 'info');
      loadAccounts();
      if (activeAccountId === id) setActiveAccountId('all');
    } catch (err) {
      showToast('Failed to remove account', 'error');
    }
  };

  // Set Default Account
  const handleSetDefaultAccount = async (id) => {
    try {
      await api.setDefaultAccount(id);
      showToast('Default sending account updated', 'success');
      loadAccounts();
    } catch (err) {
      showToast('Failed to update default account', 'error');
    }
  };

  // Star Toggle
  const handleToggleStar = async (msg) => {
    const nextStarred = !msg.isStarred;
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isStarred: nextStarred } : m))
    );
    if (selectedMessage && selectedMessage.id === msg.id) {
      setSelectedMessage((prev) => ({ ...prev, isStarred: nextStarred }));
    }

    try {
      await api.toggleStar(msg.accountId, msg.folder || activeFolder, msg.uid, nextStarred);
    } catch (err) {
      console.error('Failed to update star flag:', err);
    }
  };

  // Mark Read / Unread
  const handleMarkRead = async (msg, isRead) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isRead } : m))
    );
    try {
      await api.markRead(msg.accountId, msg.folder || activeFolder, msg.uid, isRead);
    } catch (err) {
      console.error('Failed to update read status:', err);
    }
  };

  // Delete Message
  const handleDeleteMessage = async (msg) => {
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    if (selectedMessage && selectedMessage.id === msg.id) {
      setSelectedMessage(null);
    }
    showToast('Conversation moved to Trash', 'info');

    try {
      await api.deleteMessage(msg.accountId, msg.folder || activeFolder, msg.uid);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Email Selection
  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      handleMarkRead(msg, true);
    }
  };

  // Reply
  const handleReply = (detail) => {
    setComposeInitialData({
      to: detail.from?.address || '',
      subject: detail.subject?.startsWith('Re:') ? detail.subject : `Re: ${detail.subject || ''}`,
      body: `\n\nOn ${new Date(detail.date).toLocaleString()}, ${detail.from?.name || detail.from?.address} wrote:\n> ${detail.text ? detail.text.split('\n').join('\n> ') : ''}`,
      inReplyTo: detail.headers?.messageId,
      references: detail.headers?.messageId,
    });
    setIsComposeOpen(true);
  };

  // Forward
  const handleForward = (detail) => {
    setComposeInitialData({
      to: '',
      subject: detail.subject?.startsWith('Fwd:') ? detail.subject : `Fwd: ${detail.subject || ''}`,
      body: `\n\n---------- Forwarded message ---------\nFrom: ${detail.from?.name} <${detail.from?.address}>\nDate: ${new Date(detail.date).toLocaleString()}\nSubject: ${detail.subject}\nTo: ${detail.to?.map(t => t.address).join(', ')}\n\n${detail.text || ''}`,
    });
    setIsComposeOpen(true);
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="gmail-app-layout" id="app-root">
      {/* Top Header */}
      <Header
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSelectAccount={(accId) => {
          setActiveAccountId(accId);
          setSelectedMessage(null);
        }}
        onOpenAddAccount={() => setIsAddAccountOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="gmail-main-workspace">
        <Sidebar
          activeFolder={activeFolder}
          onSelectFolder={(folder) => {
            setActiveFolder(folder);
            setSelectedMessage(null);
          }}
          accounts={accounts}
          activeAccountId={activeAccountId}
          onSelectAccount={(accId) => {
            setActiveAccountId(accId);
            setSelectedMessage(null);
          }}
          onOpenCompose={() => {
            setComposeInitialData({});
            setIsComposeOpen(true);
          }}
          onOpenAddAccount={() => setIsAddAccountOpen(true)}
          isCollapsed={isSidebarCollapsed}
          unreadCount={unreadCount}
        />

        <main className="gmail-center-stage">
          {/* Welcome Banner for 16-Digit App Password if user has no real account yet */}
          {!hasRealAccounts && (
            <div className="onboarding-notice-bar animate-fadeIn" id="onboarding-banner">
              <div className="notice-left">
                <span className="notice-icon">🔐</span>
                <div className="notice-text">
                  <strong>Link Your Real Gmail Accounts:</strong> Connect your actual inboxes
                  using 16-digit Google App Passwords for live IMAP/SMTP synchronization.
                </div>
              </div>
              <div className="notice-actions">
                <button
                  className="banner-cta-btn"
                  id="btn-banner-add-account"
                  onClick={() => setIsAddAccountOpen(true)}
                >
                  Add Account with 16-Digit App Password
                </button>
                <button
                  className="banner-guide-btn"
                  onClick={() => setIsHelpOpen(true)}
                >
                  View Guide
                </button>
              </div>
            </div>
          )}

          {/* Central Pane: Email List or Email Detail */}
          {selectedMessage ? (
            <EmailDetail
              messageSummary={selectedMessage}
              onBack={() => setSelectedMessage(null)}
              onToggleStar={handleToggleStar}
              onDeleteMessage={handleDeleteMessage}
              onReply={handleReply}
              onForward={handleForward}
              accounts={accounts}
            />
          ) : (
            <EmailList
              messages={messages}
              isLoading={isLoadingMessages}
              onRefresh={fetchMessages}
              onSelectMessage={handleSelectMessage}
              onToggleStar={handleToggleStar}
              onMarkRead={handleMarkRead}
              onDeleteMessage={handleDeleteMessage}
              activeFolder={activeFolder}
              activeAccountId={activeAccountId}
              accounts={accounts}
              onOpenAddAccount={() => setIsAddAccountOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Compose Window */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        accounts={accounts}
        defaultAccountId={activeAccountId}
        initialData={composeInitialData}
        onEmailSent={() => {
          showToast('Message sent via Gmail SMTP', 'success');
          fetchMessages();
        }}
      />

      {/* Add Account Modal (16-Digit App Password) */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAccountAdded={handleAccountAdded}
        availableColors={availableColors}
      />

      {/* Account Settings / Manager Modal */}
      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        accounts={accounts}
        onOpenAddAccount={() => setIsAddAccountOpen(true)}
        onRemoveAccount={handleRemoveAccount}
        onSetDefaultAccount={handleSetDefaultAccount}
      />

      {/* 16-Digit App Password Walkthrough Guide Modal */}
      <AppPasswordGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onOpenAddAccount={() => setIsAddAccountOpen(true)}
      />

      {/* Bottom Floating Toast Notification */}
      {toast && (
        <div className={`gmail-toast ${toast.type} animate-slideUp`} id="app-toast">
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
