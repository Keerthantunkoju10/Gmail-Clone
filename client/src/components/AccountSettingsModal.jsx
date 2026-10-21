import React from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Star,
  Layers,
  ExternalLink,
  Mail
} from 'lucide-react';

export default function AccountSettingsModal({
  isOpen,
  onClose,
  accounts = [],
  onOpenAddAccount,
  onRemoveAccount,
  onSetDefaultAccount,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div
        className="modal-card animate-scaleIn settings-modal"
        id="account-settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="google-badge-icon">
              <Layers size={22} color="#1a73e8" />
            </div>
            <div>
              <h2 className="modal-title">Manage Linked Gmail Accounts</h2>
              <p className="modal-subtitle">
                Configure your interlinked inboxes and default sending addresses
              </p>
            </div>
          </div>
          <button className="icon-btn modal-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="settings-modal-body">
          <div className="accounts-settings-list">
            {accounts.map((acc) => (
              <div key={acc.id} className="account-setting-row">
                <div
                  className="account-setting-avatar"
                  style={{ backgroundColor: acc.color?.hex || '#1a73e8' }}
                >
                  <span>{acc.initial}</span>
                </div>

                <div className="account-setting-info">
                  <div className="account-name-row">
                    <span className="setting-name">{acc.name}</span>
                    {acc.isDefault && (
                      <span className="default-badge">
                        <Star size={11} fill="currentColor" />
                        Default
                      </span>
                    )}
                    {acc.isDemo && (
                      <span className="demo-badge">Demo Account</span>
                    )}
                  </div>
                  <span className="setting-email">{acc.email}</span>
                </div>

                <div className="account-setting-actions">
                  {!acc.isDefault && !acc.isDemo && (
                    <button
                      className="pill-btn subtle-sm"
                      onClick={() => onSetDefaultAccount(acc.id)}
                      title="Make default sending account"
                    >
                      Make Default
                    </button>
                  )}

                  <button
                    className="icon-btn text-red hover-delete-btn"
                    onClick={() => onRemoveAccount(acc.id)}
                    title="Remove linked account"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="settings-add-banner">
            <div className="banner-text">
              <strong>Need to link another Gmail account?</strong>
              <p>Add unlimited Gmail accounts using their 16-character Google App Passwords.</p>
            </div>
            <button
              className="pill-btn primary"
              onClick={() => {
                onClose();
                onOpenAddAccount();
              }}
            >
              <Plus size={16} />
              <span>Link Account</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-actions-footer">
          <div className="footer-left">
            <span className="security-note text-muted">
              <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
              Encrypted locally with AES-256
            </span>
          </div>
          <button className="pill-btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
