import React, { useState } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  RotateCw,
  Sparkles,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../services/api';

export default function AddAccountModal({
  isOpen,
  onClose,
  onAccountAdded,
  availableColors = [],
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState(availableColors[0]?.hex || '#1a73e8');
  const [showPassword, setShowPassword] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Status states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  if (!isOpen) return null;

  // Format 16-character input with spaces: xxxx xxxx xxxx xxxx
  const handlePasswordChange = (e) => {
    let raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    if (raw.length > 16) raw = raw.slice(0, 16);

    // Format in blocks of 4
    const chunks = raw.match(/.{1,4}/g) || [];
    const formatted = chunks.join(' ');
    setAppPassword(formatted);
    setTestResult(null);
    setSaveError(null);
  };

  const rawPassword = appPassword.replace(/\s+/g, '');
  const isValidLength = rawPassword.length === 16;

  // Test Connection
  const handleTestConnection = async () => {
    if (!email || !isValidLength) {
      setTestResult({
        success: false,
        message: 'Please provide a valid Gmail address and 16-character App Password',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setSaveError(null);

    try {
      const data = await api.testAccountCredentials(email, rawPassword);
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Connection verified! Gmail IMAP server authenticated successfully.',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Authentication failed. Please check your credentials.',
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Authentication test failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Submit / Add Account
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !isValidLength) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const data = await api.addAccount({
        email,
        name: name || email.split('@')[0],
        appPassword: rawPassword,
        colorHex: selectedColor,
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to save account');
      }

      onAccountAdded(data.account);
      onClose();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div
        className="modal-card animate-scaleIn"
        id="add-account-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="google-badge-icon">
              <svg viewBox="0 0 48 48" width="24" height="24">
                <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
                <path fill="#1e88e5" d="M3,16.2l5,2.75l5,4.75L13,40H6c-1.657,0-3-1.343-3-3V16.2z" />
                <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
                <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L8.694,7.971C7.291,6.919,5.275,7.214,4.223,8.618C3.442,9.661,3,10.957,3,12.298z" />
                <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l4.306-3.229c1.403-1.052,3.419-0.757,4.471,0.647C44.558,9.661,45,10.957,45,12.298z" />
              </svg>
            </div>
            <div>
              <h2 className="modal-title">Link Gmail Account</h2>
              <p className="modal-subtitle">
                Add an account to your Unified Inbox using a 16-digit Google App Password
              </p>
            </div>
          </div>

          <button className="icon-btn modal-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Step-by-Step App Password Guide (Collapsible) */}
        <div className="guide-collapsible-box">
          <button
            type="button"
            className="guide-toggle-btn"
            onClick={() => setShowGuide(!showGuide)}
          >
            <div className="guide-toggle-left">
              <ShieldCheck size={18} className="text-blue" />
              <span>How do I get a 16-digit Google App Password?</span>
            </div>
            {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showGuide && (
            <div className="guide-content-body animate-fadeIn">
              <ol className="guide-steps-list">
                <li>
                  Open your <strong>Google Account</strong> (
                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noreferrer"
                  >
                    myaccount.google.com/security <ExternalLink size={12} style={{ display: 'inline' }} />
                  </a>
                  ) and make sure <strong>2-Step Verification</strong> is enabled.
                </li>
                <li>
                  Go directly to{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="highlight-link"
                  >
                    Google App Passwords <ExternalLink size={12} style={{ display: 'inline' }} />
                  </a>
                  .
                </li>
                <li>Enter an app name like <code>Gmail Clone</code> and click <strong>Create</strong>.</li>
                <li>
                  Google will display a <strong>16-character password</strong> (e.g., <code>abcd efgh ijkl mnop</code>).
                </li>
                <li>Copy and paste that 16-character code below!</li>
              </ol>
            </div>
          )}
        </div>

        {/* Account Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Email Address */}
          <div className="form-group">
            <label className="form-label">Gmail Address</label>
            <input
              type="email"
              id="input-account-email"
              className="form-input"
              placeholder="e.g. yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Account Label / Name */}
          <div className="form-group">
            <label className="form-label">Account Label (Optional)</label>
            <input
              type="text"
              id="input-account-name"
              className="form-input"
              placeholder="e.g. Work Mail, Personal, University"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Color Badge Picker */}
          <div className="form-group">
            <label className="form-label">Account Color Badge (for Unified Inbox)</label>
            <div className="color-palette-selector">
              {availableColors.map((col) => (
                <button
                  key={col.hex}
                  type="button"
                  className={`color-swatch-btn ${selectedColor === col.hex ? 'selected' : ''}`}
                  style={{ backgroundColor: col.hex }}
                  onClick={() => setSelectedColor(col.hex)}
                  title={col.name}
                >
                  {selectedColor === col.hex && <CheckCircle2 size={16} color="#fff" />}
                </button>
              ))}
            </div>
          </div>

          {/* 16-Digit App Password Input */}
          <div className="form-group">
            <div className="label-with-counter">
              <label className="form-label">
                Google App Password (16 Letters)
              </label>
              <span
                className={`char-counter ${isValidLength ? 'valid' : 'invalid'}`}
              >
                {rawPassword.length} / 16 chars
              </span>
            </div>

            <div className="app-password-input-wrapper">
              <KeyRound size={18} className="password-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="input-app-password"
                className="form-input password-input monospace-input"
                placeholder="xxxx xxxx xxxx xxxx"
                value={appPassword}
                onChange={handlePasswordChange}
                required
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                className="icon-btn toggle-visibility-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="field-hint">
              Formats automatically into 4 blocks of 4. Passwords are encrypted on your local machine using AES-256.
            </p>
          </div>

          {/* Test Result Feedback Box */}
          {testResult && (
            <div
              className={`feedback-box ${testResult.success ? 'success' : 'error'} animate-fadeIn`}
            >
              {testResult.success ? (
                <CheckCircle2 size={18} className="text-green flex-shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-red flex-shrink-0" />
              )}
              <span className="feedback-message">{testResult.message}</span>
            </div>
          )}

          {/* Save Error */}
          {saveError && (
            <div className="feedback-box error animate-fadeIn">
              <AlertCircle size={18} className="text-red flex-shrink-0" />
              <span className="feedback-message">{saveError}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-actions-footer">
            <button
              type="button"
              className="pill-btn secondary"
              id="btn-test-connection"
              onClick={handleTestConnection}
              disabled={isTesting || !email || !isValidLength}
            >
              {isTesting ? (
                <>
                  <RotateCw size={15} className="animate-spin" />
                  <span>Verifying IMAP...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Test Connection</span>
                </>
              )}
            </button>

            <div className="action-right-group">
              <button
                type="button"
                className="pill-btn subtle"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="pill-btn primary"
                id="btn-save-account"
                disabled={isSaving || !email || !isValidLength}
              >
                {isSaving ? (
                  <>
                    <RotateCw size={15} className="animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Layers size={16} />
                    <span>Link & Sync Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
