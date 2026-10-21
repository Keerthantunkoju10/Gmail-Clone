import React from 'react';
import {
  X,
  ShieldCheck,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function AppPasswordGuideModal({ isOpen, onClose, onOpenAddAccount }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div
        className="modal-card animate-scaleIn guide-modal-card"
        id="app-password-guide-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="google-badge-icon">
              <ShieldCheck size={24} color="#1a73e8" />
            </div>
            <div>
              <h2 className="modal-title">16-Digit Google App Password Guide</h2>
              <p className="modal-subtitle">
                Official Google security requirement for connecting Gmail to third-party clients
              </p>
            </div>
          </div>
          <button className="icon-btn modal-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="guide-modal-body">
          <div className="guide-intro-banner">
            <p>
              In 2022, Google phased out "Less Secure Apps" and regular password logins for IMAP/SMTP.
              To connect any external email client, Google requires an <strong>App Password</strong>: a secure,
              16-character code that grants access without revealing your primary Google account password.
            </p>
          </div>

          <h3 className="section-step-heading">Step-by-Step Instructions</h3>

          <div className="steps-container">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-details">
                <h4>Turn on 2-Step Verification</h4>
                <p>
                  Google only allows App Passwords for accounts with 2-Step Verification enabled. If you already have 2FA enabled, skip to Step 2.
                </p>
                <a
                  href="https://myaccount.google.com/signinoptions/two-step-verification"
                  target="_blank"
                  rel="noreferrer"
                  className="step-link-btn"
                >
                  <span>Go to 2-Step Verification</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-details">
                <h4>Open Google App Passwords Page</h4>
                <p>
                  Navigate directly to the App Passwords page in your Google Account security settings.
                </p>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="step-link-btn highlight"
                >
                  <span>Open myaccount.google.com/apppasswords</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-details">
                <h4>Generate the 16-Character Password</h4>
                <p>
                  Enter an App name (e.g., <code>Gmail Clone</code>) and click <strong>Create</strong>.
                </p>
                <div className="visual-code-mock">
                  <span className="code-label">Google will display your 16-digit password:</span>
                  <div className="code-display">
                    <span>abcd</span>
                    <span>efgh</span>
                    <span>ijkl</span>
                    <span>mnop</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-details">
                <h4>Paste & Link Account</h4>
                <p>
                  Copy the 16 letters and paste them into this clone's <strong>Link Account</strong> dialog.
                  Our client auto-formats the input, tests the IMAP connection live, and saves the credentials encrypted locally.
                </p>
              </div>
            </div>
          </div>

          {/* Security Guarantee Box */}
          <div className="security-guarantee-card">
            <Lock size={20} className="text-green flex-shrink-0" />
            <div>
              <strong>Local & Secure Encryption</strong>
              <p>
                Your 16-character App Passwords are never sent to third-party cloud servers.
                They are stored strictly on your local PC and encrypted with military-grade AES-256-GCM.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-actions-footer">
          <button className="pill-btn subtle" onClick={onClose}>
            Close
          </button>
          <button
            className="pill-btn primary"
            onClick={() => {
              onClose();
              onOpenAddAccount();
            }}
          >
            <span>Ready to Link Account</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
