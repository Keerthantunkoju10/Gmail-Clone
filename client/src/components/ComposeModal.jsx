import React, { useState, useRef } from 'react';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  Paperclip,
  Trash2,
  RotateCw,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  ChevronDown,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ComposeModal({
  isOpen,
  onClose,
  accounts = [],
  defaultAccountId,
  initialData = {}, // { to, subject, body, inReplyTo, references }
  onEmailSent,
}) {
  const [selectedAccountId, setSelectedAccountId] = useState(
    defaultAccountId && defaultAccountId !== 'all' ? defaultAccountId : accounts[0]?.id
  );
  const [to, setTo] = useState(initialData.to || '');
  const [cc, setCc] = useState(initialData.cc || '');
  const [bcc, setBcc] = useState(initialData.bcc || '');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(initialData.subject || '');
  const [body, setBody] = useState(initialData.body || '');
  const [attachments, setAttachments] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!to || !selectedAccountId) {
      setError('Please specify recipient (To) and sender account');
      return;
    }

    setIsSending(true);
    setError(null);

    const formData = new FormData();
    formData.append('accountId', selectedAccountId);
    formData.append('to', to);
    if (cc) formData.append('cc', cc);
    if (bcc) formData.append('bcc', bcc);
    formData.append('subject', subject || '(no subject)');
    formData.append('text', body);
    formData.append('html', `<div style="font-family: Roboto, Arial, sans-serif; line-height: 1.6;">${body.replace(/\n/g, '<br/>')}</div>`);

    if (initialData.inReplyTo) formData.append('inReplyTo', initialData.inReplyTo);
    if (initialData.references) formData.append('references', initialData.references);

    attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    try {
      const data = await api.sendMessage(formData);
      onEmailSent(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter to send
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div
      className={`compose-window ${isMinimized ? 'minimized' : ''} ${
        isMaximized ? 'maximized' : ''
      } animate-slideUp`}
      id="compose-modal-window"
      onKeyDown={handleKeyDown}
    >
      {/* Title Bar */}
      <div className="compose-header">
        <div className="compose-title">
          <span>{subject || 'New Message'}</span>
        </div>
        <div className="compose-window-controls">
          <button
            className="window-control-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Restore' : 'Minimize'}
          >
            <Minus size={15} />
          </button>
          <button
            className="window-control-btn"
            onClick={() => {
              setIsMaximized(!isMaximized);
              setIsMinimized(false);
            }}
            title={isMaximized ? 'Exit full screen' : 'Full screen'}
          >
            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            className="window-control-btn close-btn"
            onClick={onClose}
            title="Save & close"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Main Compose Body */}
      {!isMinimized && (
        <form onSubmit={handleSend} className="compose-form">
          {/* Sender Account Selector */}
          <div className="compose-field sender-field">
            <span className="field-label">From:</span>
            <div className="account-select-wrapper">
              <span
                className="sender-color-dot"
                style={{ backgroundColor: currentAccount?.color?.hex || '#1a73e8' }}
              />
              <select
                id="select-from-account"
                className="account-select-dropdown"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} &lt;{acc.email}&gt;
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* To Field */}
          <div className="compose-field">
            <input
              type="text"
              id="input-compose-to"
              className="compose-input"
              placeholder="Recipients (To)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
            <div className="cc-bcc-buttons">
              {!showCc && (
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setShowCc(true)}
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setShowBcc(true)}
                >
                  Bcc
                </button>
              )}
            </div>
          </div>

          {/* Cc Field */}
          {showCc && (
            <div className="compose-field animate-fadeIn">
              <input
                type="text"
                className="compose-input"
                placeholder="Cc"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
              />
            </div>
          )}

          {/* Bcc Field */}
          {showBcc && (
            <div className="compose-field animate-fadeIn">
              <input
                type="text"
                className="compose-input"
                placeholder="Bcc"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
              />
            </div>
          )}

          {/* Subject Field */}
          <div className="compose-field">
            <input
              type="text"
              id="input-compose-subject"
              className="compose-input subject-input"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body Textarea */}
          <div className="compose-body-area">
            <textarea
              id="textarea-compose-body"
              className="compose-textarea"
              placeholder="Write your email here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {/* Attachment Chips */}
          {attachments.length > 0 && (
            <div className="compose-attachments-list">
              {attachments.map((file, idx) => (
                <div key={idx} className="compose-attachment-chip">
                  <Paperclip size={13} />
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => removeAttachment(idx)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error notice */}
          {error && (
            <div className="compose-error-banner animate-fadeIn">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Bottom Toolbar & Send Button */}
          <div className="compose-footer">
            <div className="footer-left">
              <button
                type="submit"
                id="btn-send-mail"
                className="pill-btn primary send-btn"
                disabled={isSending || !to}
                title="Send (Ctrl+Enter)"
              >
                {isSending ? (
                  <>
                    <RotateCw size={15} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <Send size={15} />
                  </>
                )}
              </button>

              {/* Attachment Button */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
                onChange={handleFileChange}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach files"
              >
                <Paperclip size={17} />
              </button>
            </div>

            <div className="footer-right">
              <button
                type="button"
                className="icon-btn"
                onClick={onClose}
                title="Discard draft"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
