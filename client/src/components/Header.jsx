import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  X,
  SlidersHorizontal,
  HelpCircle,
  Moon,
  Sun,
  Grid,
  Plus,
  Check,
  Trash2,
  Settings,
  Mail,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Layers
} from 'lucide-react';

export default function Header({
  accounts = [],
  activeAccountId,
  onSelectAccount,
  onOpenAddAccount,
  onOpenSettings,
  onOpenHelp,
  searchQuery,
  onSearchChange,
  theme,
  onToggleTheme,
  isSidebarCollapsed,
  onToggleSidebar,
}) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSearchFilterOpen, setIsSearchFilterOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const isUnified = activeAccountId === 'all';

  return (
    <header className="gmail-header" id="main-header">
      {/* Left Branding & Menu */}
      <div className="header-left">
        <button
          className="icon-btn"
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={20} />
        </button>

        <div className="brand-logo" onClick={() => onSelectAccount('all')}>
          <div className="gmail-icon-wrapper">
            <svg viewBox="0 0 48 48" className="gmail-svg">
              <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
              <path fill="#1e88e5" d="M3,16.2l5,2.75l5,4.75L13,40H6c-1.657,0-3-1.343-3-3V16.2z" />
              <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
              <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L8.694,7.971C7.291,6.919,5.275,7.214,4.223,8.618C3.442,9.661,3,10.957,3,12.298z" />
              <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l4.306-3.229c1.403-1.052,3.419-0.757,4.471,0.647C44.558,9.661,45,10.957,45,12.298z" />
            </svg>
          </div>
          <span className="brand-text">Gmail</span>
          <span className="brand-badge">Multi-Account</span>
        </div>
      </div>

      {/* Central Search Bar */}
      <div className="header-search">
        <div className="search-bar-container">
          <button className="icon-btn search-icon-btn" title="Search">
            <Search size={18} />
          </button>
          <input
            type="text"
            id="search-input"
            className="search-input"
            placeholder={
              isUnified
                ? 'Search in all linked inboxes...'
                : `Search in ${activeAccount?.name || 'inbox'}...`
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="icon-btn clear-search-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <button
            className="icon-btn search-options-btn"
            onClick={() => setIsSearchFilterOpen(!isSearchFilterOpen)}
            title="Search options"
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </div>

      {/* Right Controls & Account Switcher */}
      <div className="header-right">
        {/* App Password Guide button */}
        <button
          className="header-pill-btn"
          id="btn-help-guide"
          onClick={onOpenHelp}
          title="App Password Guide"
        >
          <ShieldCheck size={16} className="text-green" />
          <span>16-Digit App Password Guide</span>
        </button>

        {/* Theme Toggle */}
        <button
          className="icon-btn"
          id="btn-theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Google Account Switcher Avatar */}
        <div className="account-switcher-wrapper" ref={accountMenuRef}>
          <button
            className={`account-avatar-btn ${isUnified ? 'is-unified-active' : ''}`}
            id="btn-account-menu"
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            title="Google Account"
          >
            {isUnified ? (
              <div className="avatar-circle unified-avatar-gradient">
                <Layers size={18} color="#fff" />
              </div>
            ) : (
              <div
                className="avatar-circle"
                style={{
                  backgroundColor: activeAccount?.color?.hex || '#1a73e8',
                }}
              >
                <span>{activeAccount?.initial || 'U'}</span>
              </div>
            )}
            <ChevronDown size={14} className="avatar-chevron" />
          </button>

          {/* Account Switcher Dropdown */}
          {isAccountMenuOpen && (
            <div className="account-dropdown-card animate-scaleIn" id="account-dropdown">
              <div className="account-card-header">
                <div className="account-avatar-lg" style={{ backgroundColor: isUnified ? '#4285F4' : (activeAccount?.color?.hex || '#1a73e8') }}>
                  {isUnified ? <Layers size={24} color="#fff" /> : <span>{activeAccount?.initial || 'U'}</span>}
                </div>
                <div className="account-card-user">
                  <div className="user-name">
                    {isUnified ? 'Unified Multi-Account View' : (activeAccount?.name || 'Active Account')}
                  </div>
                  <div className="user-email">
                    {isUnified ? `${accounts.length} interlinked accounts` : activeAccount?.email}
                  </div>
                </div>
              </div>

              <div className="account-dropdown-divider" />

              <div className="account-list-label">
                <span>INTERLINKED ACCOUNTS</span>
                <span className="accounts-count-pill">{accounts.length} accounts</span>
              </div>

              {/* Unified Inbox Switcher Item */}
              <div
                className={`account-row-item ${isUnified ? 'active' : ''}`}
                id="account-switch-unified"
                onClick={() => {
                  onSelectAccount('all');
                  setIsAccountMenuOpen(false);
                }}
              >
                <div className="account-row-avatar unified-gradient">
                  <Layers size={16} color="#fff" />
                </div>
                <div className="account-row-info">
                  <span className="account-row-title">🌟 All Inboxes (Unified)</span>
                  <span className="account-row-sub">Merged view of all accounts</span>
                </div>
                {isUnified && <Check size={18} className="account-check-icon" />}
              </div>

              {/* Individual Accounts List */}
              <div className="account-items-scroll">
                {accounts.map((acc) => {
                  const isCurrent = activeAccountId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      className={`account-row-item ${isCurrent ? 'active' : ''}`}
                      id={`account-switch-${acc.id}`}
                      onClick={() => {
                        onSelectAccount(acc.id);
                        setIsAccountMenuOpen(false);
                      }}
                    >
                      <div
                        className="account-row-avatar"
                        style={{ backgroundColor: acc.color?.hex || '#1a73e8' }}
                      >
                        <span>{acc.initial}</span>
                      </div>
                      <div className="account-row-info">
                        <span className="account-row-title">{acc.name}</span>
                        <span className="account-row-sub">{acc.email}</span>
                      </div>
                      {isCurrent && <Check size={18} className="account-check-icon" />}
                    </div>
                  );
                })}
              </div>

              <div className="account-dropdown-divider" />

              {/* Actions Footer */}
              <div className="account-dropdown-footer">
                <button
                  className="dropdown-action-btn primary"
                  id="btn-add-account-from-menu"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onOpenAddAccount();
                  }}
                >
                  <Plus size={16} />
                  <span>Add another account (16-Digit App Password)</span>
                </button>

                <button
                  className="dropdown-action-btn secondary"
                  id="btn-manage-accounts"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onOpenSettings();
                  }}
                >
                  <Settings size={16} />
                  <span>Manage linked accounts</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
