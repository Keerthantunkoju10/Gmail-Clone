import React from 'react';
import {
  Inbox,
  Star,
  Clock,
  Send,
  FileText,
  Trash2,
  AlertOctagon,
  Plus,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Circle
} from 'lucide-react';

export default function Sidebar({
  folders,
  activeFolder,
  onSelectFolder,
  accounts = [],
  activeAccountId,
  onSelectAccount,
  onOpenCompose,
  onOpenAddAccount,
  isCollapsed,
  unreadCount = 0,
}) {
  const mailboxes = [
    {
      id: 'all',
      name: 'All Inboxes',
      icon: Layers,
      isUnified: true,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: 'inbox',
      name: 'Inbox',
      icon: Inbox,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: 'starred',
      name: 'Starred',
      icon: Star,
    },
    {
      id: 'snoozed',
      name: 'Snoozed',
      icon: Clock,
    },
    {
      id: 'sent',
      name: 'Sent',
      icon: Send,
    },
    {
      id: 'drafts',
      name: 'Drafts',
      icon: FileText,
    },
    {
      id: 'trash',
      name: 'Trash',
      icon: Trash2,
    },
    {
      id: 'spam',
      name: 'Spam',
      icon: AlertOctagon,
    },
  ];

  return (
    <aside
      className={`gmail-sidebar ${isCollapsed ? 'collapsed' : ''}`}
      id="main-sidebar"
    >
      {/* Compose Button */}
      <div className="compose-button-wrapper">
        <button
          className="compose-btn"
          id="btn-compose-mail"
          onClick={onOpenCompose}
          title="Compose new email"
        >
          <svg className="compose-pencil-icon" viewBox="0 0 24 24" width="24" height="24">
            <path
              fill="#EA4335"
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
            />
            <path
              fill="#4285F4"
              d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
            />
          </svg>
          {!isCollapsed && <span className="compose-btn-text">Compose</span>}
        </button>
      </div>

      {/* Main Mailbox Navigation */}
      <nav className="sidebar-nav">
        {mailboxes.map((item) => {
          const Icon = item.icon;
          const isActive = activeFolder === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''} ${item.isUnified ? 'unified-nav-item' : ''}`}
              id={`nav-folder-${item.id}`}
              onClick={() => onSelectFolder(item.id)}
              data-tooltip={isCollapsed ? item.name : undefined}
            >
              <div className="nav-item-icon-wrapper">
                <Icon size={19} className="nav-icon" />
              </div>
              {!isCollapsed && (
                <>
                  <span className="nav-item-name">{item.name}</span>
                  {item.badge && <span className="nav-item-badge">{item.badge}</span>}
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* Interlinked Accounts Quick Filter Section */}
      {!isCollapsed && (
        <div className="sidebar-accounts-section">
          <div className="accounts-header">
            <span className="section-title">LINKED ACCOUNTS</span>
            <button
              className="add-account-mini-btn"
              id="sidebar-btn-add-account"
              onClick={onOpenAddAccount}
              title="Add another Gmail account"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="accounts-quick-list">
            {/* Unified Inbox item */}
            <div
              className={`account-quick-item ${activeAccountId === 'all' ? 'selected' : ''}`}
              onClick={() => onSelectAccount('all')}
            >
              <div className="account-color-dot unified-dot" />
              <span className="account-quick-name">All Inboxes (Combined)</span>
            </div>

            {/* Individual Accounts */}
            {accounts.map((acc) => {
              const isSelected = activeAccountId === acc.id;
              return (
                <div
                  key={acc.id}
                  className={`account-quick-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectAccount(acc.id)}
                  title={acc.email}
                >
                  <div
                    className="account-color-dot"
                    style={{ backgroundColor: acc.color?.hex || '#1a73e8' }}
                  />
                  <div className="account-quick-details">
                    <span className="account-quick-name">{acc.name}</span>
                    <span className="account-quick-email">{acc.email}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Connection Status */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="connection-badge">
            <CheckCircle2 size={13} className="text-green" />
            <span>IMAP / SMTP Synchronized</span>
          </div>
        </div>
      )}
    </aside>
  );
}
