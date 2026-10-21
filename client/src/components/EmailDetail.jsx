import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Trash2,
  Mail,
  Star,
  Printer,
  CornerUpLeft,
  CornerUpRight,
  Download,
  Paperclip,
  RotateCw,
  ShieldCheck,
  ChevronDown,
  Layers,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function EmailDetail({
  messageSummary,
  onBack,
  onToggleStar,
  onDeleteMessage,
  onReply,
  onForward,
  accounts = [],
}) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRecipientDetails, setShowRecipientDetails] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const folder = messageSummary.folder || 'inbox';
    const accountId = messageSummary.accountId;
    const uid = messageSummary.uid;

    api.getMessageDetail(accountId, folder, uid)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Fetch email detail error:', err);
          setError(err.message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [messageSummary]);

  const targetAccount = accounts.find((a) => a.id === messageSummary.accountId);
  const displayAccountName = targetAccount?.name || messageSummary.accountName || messageSummary.accountEmail;

  return (
    <div className="gmail-detail-container" id="email-detail-view">
      {/* Top Action Toolbar */}
      <div className="detail-toolbar">
        <div className="toolbar-left">
          <button
            className="icon-btn back-btn"
            id="btn-back-to-list"
            onClick={onBack}
            title="Back to list"
          >
            <ArrowLeft size={19} />
          </button>

          <button
            className="icon-btn"
            onClick={() => onDeleteMessage(messageSummary)}
            title="Delete"
          >
            <Trash2 size={18} />
          </button>

          <button
            className="icon-btn"
            onClick={() => onToggleStar(messageSummary)}
            title={messageSummary.isStarred ? 'Unstar' : 'Star'}
          >
            <Star
              size={18}
              fill={messageSummary.isStarred ? '#f4b400' : 'none'}
              color={messageSummary.isStarred ? '#f4b400' : 'var(--text-muted)'}
            />
          </button>
        </div>

        <div className="toolbar-right">
          <button
            className="icon-btn"
            onClick={() => window.print()}
            title="Print email"
          >
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Main Email Body Container */}
      <div className="detail-content-scroll">
        {isLoading ? (
          <div className="detail-loading-state">
            <RotateCw size={30} className="animate-spin text-blue" />
            <p>Loading full message content from Gmail...</p>
          </div>
        ) : error ? (
          <div className="detail-error-state">
            <p className="error-text">Failed to load message: {error}</p>
            <button className="pill-btn primary" onClick={onBack}>
              Return to Inbox
            </button>
          </div>
        ) : (
          <div className="detail-article animate-fadeIn">
            {/* Subject Title & Account Target Badge */}
            <div className="detail-header-row">
              <h2 className="detail-subject">{detail?.subject || messageSummary.subject}</h2>
              
              <div
                className="detail-account-pill"
                style={{
                  backgroundColor: targetAccount?.color?.bg || '#e8f0fe',
                  color: targetAccount?.color?.text || '#1967d2',
                  borderColor: targetAccount?.color?.hex || '#1a73e8',
                }}
                title={`Delivered to: ${targetAccount?.email || messageSummary.accountEmail}`}
              >
                <Layers size={13} />
                <span>Account: {displayAccountName}</span>
              </div>
            </div>

            {/* Sender and Recipients Header Card */}
            <div className="detail-sender-card">
              <div
                className="sender-avatar"
                style={{
                  backgroundColor: targetAccount?.color?.hex || '#1a73e8',
                }}
              >
                <span>{(detail?.from?.name || detail?.from?.address || 'U')[0].toUpperCase()}</span>
              </div>

              <div className="sender-meta">
                <div className="sender-line">
                  <span className="sender-full-name">
                    {detail?.from?.name || detail?.from?.address}
                  </span>
                  <span className="sender-email-address">
                    &lt;{detail?.from?.address}&gt;
                  </span>
                </div>

                <div className="recipient-line">
                  <span
                    className="recipient-summary-btn"
                    onClick={() => setShowRecipientDetails(!showRecipientDetails)}
                  >
                    to {detail?.to?.[0]?.name || detail?.to?.[0]?.address || 'me'}
                    <ChevronDown size={14} />
                  </span>
                </div>

                {/* Recipient Details Dropdown */}
                {showRecipientDetails && (
                  <div className="recipient-details-dropdown animate-fadeIn">
                    <div className="detail-row">
                      <strong>from:</strong> <span>{detail?.from?.address}</span>
                    </div>
                    <div className="detail-row">
                      <strong>to:</strong>{' '}
                      <span>{detail?.to?.map((t) => t.address).join(', ') || messageSummary.accountEmail}</span>
                    </div>
                    <div className="detail-row">
                      <strong>date:</strong> <span>{new Date(detail?.date).toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <strong>subject:</strong> <span>{detail?.subject}</span>
                    </div>
                    <div className="detail-row">
                      <strong>security:</strong>{' '}
                      <span className="text-green">
                        <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
                        Standard IMAP/TLS Encryption
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="detail-date-time">
                <span>{new Date(detail?.date || messageSummary.date).toLocaleString()}</span>
              </div>
            </div>

            {/* Email Body Content */}
            <div className="detail-body-container">
              {detail?.html ? (
                <div
                  className="email-html-body"
                  dangerouslySetInnerHTML={{ __html: detail.html }}
                />
              ) : (
                <div className="email-plain-body">
                  <pre>{detail?.text || messageSummary.snippet || '(Empty body)'}</pre>
                </div>
              )}
            </div>

            {/* Attachments Section */}
            {detail?.attachments && detail.attachments.length > 0 && (
              <div className="detail-attachments-section">
                <div className="attachments-title">
                  <Paperclip size={16} />
                  <span>{detail.attachments.length} Attachments</span>
                </div>

                <div className="attachments-grid">
                  {detail.attachments.map((att, idx) => (
                    <div key={idx} className="attachment-card">
                      <div className="attachment-info">
                        <span className="attachment-name" title={att.filename}>
                          {att.filename}
                        </span>
                        <span className="attachment-size">
                          {(att.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      {att.base64 && (
                        <a
                          href={att.base64}
                          download={att.filename}
                          className="attachment-download-btn"
                          title="Download attachment"
                        >
                          <Download size={15} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Reply & Forward Actions */}
            <div className="detail-footer-actions">
              <button
                className="detail-footer-btn"
                onClick={() => onReply(detail || messageSummary)}
              >
                <CornerUpLeft size={16} />
                <span>Reply</span>
              </button>
              <button
                className="detail-footer-btn"
                onClick={() => onForward(detail || messageSummary)}
              >
                <CornerUpRight size={16} />
                <span>Forward</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
