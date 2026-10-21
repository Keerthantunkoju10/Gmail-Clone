import React, { useState } from 'react';
import {
  RotateCw,
  MoreVertical,
  Star,
  CheckSquare,
  Square,
  Trash2,
  Mail,
  MailOpen,
  Paperclip,
  Inbox,
  Tag,
  Users,
  AlertCircle,
  Archive,
  Clock,
  Sparkles,
  Layers,
  Plus
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

export default function EmailList({
  messages = [],
  isLoading,
  onRefresh,
  onSelectMessage,
  onToggleStar,
  onMarkRead,
  onDeleteMessage,
  activeFolder,
  activeAccountId,
  accounts = [],
  onOpenAddAccount,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('primary');

  const isUnified = activeAccountId === 'all';
  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  // Selection handlers
  const handleToggleSelect = (e, id) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === messages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messages.map((m) => m.id)));
    }
  };

  // Bulk actions
  const handleBulkDelete = () => {
    selectedIds.forEach((id) => {
      const msg = messages.find((m) => m.id === id);
      if (msg) onDeleteMessage(msg);
    });
    setSelectedIds(new Set());
  };

  const handleBulkMarkRead = (read) => {
    selectedIds.forEach((id) => {
      const msg = messages.find((m) => m.id === id);
      if (msg) onMarkRead(msg, read);
    });
    setSelectedIds(new Set());
  };

  const tabs = [
    { id: 'primary', label: 'Primary', icon: Inbox, color: '#1a73e8' },
    { id: 'promotions', label: 'Promotions', icon: Tag, color: '#188038' },
    { id: 'social', label: 'Social', icon: Users, color: '#129EAF' },
    { id: 'updates', label: 'Updates', icon: AlertCircle, color: '#e37400' },
  ];

  return (
    <div className="gmail-mail-container" id="email-list-container">
      {/* Action Toolbar */}
      <div className="mail-toolbar">
        <div className="toolbar-left">
          {/* Select all checkbox */}
          <button
            className="icon-btn toolbar-check-btn"
            onClick={handleSelectAll}
            title={selectedIds.size === messages.length ? 'Deselect all' : 'Select all'}
          >
            {selectedIds.size > 0 && selectedIds.size === messages.length ? (
              <CheckSquare size={18} className="text-blue" />
            ) : selectedIds.size > 0 ? (
              <div className="checkbox-indeterminate" />
            ) : (
              <Square size={18} />
            )}
          </button>

          {/* Refresh button */}
          <button
            className={`icon-btn ${isLoading ? 'animate-spin' : ''}`}
            onClick={onRefresh}
            title="Refresh"
            id="btn-refresh-mail"
          >
            <RotateCw size={17} />
          </button>

          {/* Bulk Action Buttons */}
          {selectedIds.size > 0 && (
            <div className="bulk-actions-group animate-fadeIn">
              <button
                className="icon-btn"
                onClick={handleBulkDelete}
                title="Delete selected"
              >
                <Trash2 size={17} />
              </button>
              <button
                className="icon-btn"
                onClick={() => handleBulkMarkRead(true)}
                title="Mark as read"
              >
                <MailOpen size={17} />
              </button>
              <button
                className="icon-btn"
                onClick={() => handleBulkMarkRead(false)}
                title="Mark as unread"
              >
                <Mail size={17} />
              </button>
              <span className="selected-count-label">
                {selectedIds.size} selected
              </span>
            </div>
          )}
        </div>

        {/* Current View Breadcrumb / Badge */}
        <div className="toolbar-right">
          <div className="active-view-indicator">
            {isUnified ? (
              <div className="unified-indicator-pill">
                <Layers size={13} />
                <span>Unified Inbox ({accounts.length} Accounts)</span>
              </div>
            ) : (
              <div
                className="account-indicator-pill"
                style={{
                  backgroundColor: activeAccount?.color?.bg || '#e8f0fe',
                  color: activeAccount?.color?.text || '#1967d2',
                  borderColor: activeAccount?.color?.hex || '#1a73e8',
                }}
              >
                <span
                  className="pill-dot"
                  style={{ backgroundColor: activeAccount?.color?.hex || '#1a73e8' }}
                />
                <span>{activeAccount?.name || activeAccount?.email}</span>
              </div>
            )}
          </div>
          <span className="pagination-text">
            {messages.length > 0 ? `1–${messages.length} of ${messages.length}` : '0 of 0'}
          </span>
        </div>
      </div>

      {/* Gmail Category Tabs */}
      {activeFolder === 'inbox' || activeFolder === 'all' ? (
        <div className="gmail-tabs-header">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${isTabActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  '--tab-color': tab.color,
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Email List Content */}
      <div className="email-rows-scroll">
        {isLoading && messages.length === 0 ? (
          <div className="email-list-loading">
            <RotateCw size={32} className="animate-spin text-blue" />
            <p>Syncing Gmail via IMAP...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="email-list-empty">
            <div className="empty-icon-circle">
              <Inbox size={48} className="text-muted" />
            </div>
            <h3>Your {activeFolder} is empty</h3>
            <p>No messages found for the current selection.</p>
            <button
              className="add-account-banner-btn"
              onClick={onOpenAddAccount}
            >
              <Plus size={16} />
              <span>Link Another Gmail Account (16-Digit App Password)</span>
            </button>
          </div>
        ) : (
          <div className="email-list-items">
            {messages.map((msg) => {
              const isSelected = selectedIds.has(msg.id);
              return (
                <div
                  key={msg.id}
                  className={`email-row-item ${msg.isRead ? 'read' : 'unread'} ${
                    isSelected ? 'selected' : ''
                  }`}
                  id={`email-row-${msg.id}`}
                  onClick={() => onSelectMessage(msg)}
                >
                  {/* Selection Checkbox */}
                  <div
                    className="row-checkbox-cell"
                    onClick={(e) => handleToggleSelect(e, msg.id)}
                  >
                    {isSelected ? (
                      <CheckSquare size={17} className="text-blue" />
                    ) : (
                      <Square size={17} className="checkbox-empty" />
                    )}
                  </div>

                  {/* Star Toggle */}
                  <button
                    className={`star-btn ${msg.isStarred ? 'starred' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(msg);
                    }}
                    title={msg.isStarred ? 'Starred' : 'Not starred'}
                  >
                    <Star
                      size={18}
                      fill={msg.isStarred ? '#f4b400' : 'none'}
                      color={msg.isStarred ? '#f4b400' : 'var(--text-muted)'}
                    />
                  </button>

                  {/* Account Badge (Essential for Unified Inbox!) */}
                  {isUnified && (
                    <div
                      className="row-account-chip"
                      style={{
                        backgroundColor: msg.accountColor?.bg || '#e8f0fe',
                        color: msg.accountColor?.text || '#1967d2',
                      }}
                      title={`Received by: ${msg.accountEmail || msg.accountName}`}
                    >
                      <span
                        className="chip-color-dot"
                        style={{ backgroundColor: msg.accountColor?.hex || '#1a73e8' }}
                      />
                      <span>{msg.accountName || msg.accountEmail?.split('@')[0]}</span>
                    </div>
                  )}

                  {/* Sender Name */}
                  <div className="row-sender-cell" title={msg.from?.address}>
                    <span className="sender-name">
                      {msg.from?.name || msg.from?.address}
                    </span>
                  </div>

                  {/* Subject & Preview Snippet */}
                  <div className="row-body-cell">
                    <span className="row-subject">{msg.subject}</span>
                    <span className="row-separator">&nbsp;—&nbsp;</span>
                    <span className="row-snippet">{msg.snippet}</span>
                  </div>

                  {/* Attachment Icon */}
                  {msg.hasAttachments && (
                    <div className="row-attachment-cell" title="Has attachment">
                      <Paperclip size={15} className="text-muted" />
                    </div>
                  )}

                  {/* Date/Time */}
                  <div className="row-date-cell">
                    <span>{formatDate(msg.date)}</span>
                  </div>

                  {/* Quick Action Icons on Hover */}
                  <div className="row-hover-actions">
                    <button
                      className="icon-btn hover-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMessage(msg);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      className="icon-btn hover-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkRead(msg, !msg.isRead);
                      }}
                      title={msg.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      {msg.isRead ? <Mail size={16} /> : <MailOpen size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
