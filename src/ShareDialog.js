/* eslint-disable no-unused-vars */
import React, { useRef, useState } from "react";
import "./ShareDialog.css";

// Icon Components
const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EmailIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 6L12 13L2 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CopyIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WhatsAppIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.6 6.31999C16.8 5.49999 15.8 4.89999 14.7 4.49999C13.6 4.09999 12.5 3.99999 11.3 4.09999C10.1 4.19999 9.00001 4.49999 7.90001 5.09999C6.80001 5.59999 5.90001 6.39999 5.10001 7.29999C4.30001 8.19999 3.80001 9.19999 3.40001 10.4C3.00001 11.6 2.90001 12.7 3.00001 13.9C3.10001 15.1 3.40001 16.2 4.00001 17.3L3.00001 21L6.70001 20C7.80001 20.6 8.90001 20.9 10.1 21C11.3 21.1 12.4 20.9 13.6 20.6C14.8 20.2 15.8 19.7 16.7 18.9C17.6 18.2 18.3 17.2 18.9 16.1C19.4 15 19.8 13.9 19.9 12.7C20 11.5 19.9 10.4 19.5 9.29999C19.1 8.29999 18.5 7.19999 17.6 6.31999ZM16.1 15.8C15.7 16.3 15.2 16.7 14.7 17C14.1 17.3 13.5 17.5 12.9 17.6C12.3 17.7 11.6 17.7 11 17.5C10.4 17.3 9.80001 17.1 9.20001 16.8L8.40001 16.4L5.90001 17L6.50001 14.5L6.10001 13.7C5.80001 13.1 5.60001 12.5 5.40001 11.9C5.30001 11.3 5.20001 10.6 5.30001 10C5.40001 9.39999 5.60001 8.79999 5.80001 8.19999C6.10001 7.59999 6.50001 7.09999 7.00001 6.59999C7.50001 6.09999 8.10001 5.79999 8.70001 5.49999C9.30001 5.29999 10 5.09999 10.6 5.09999C11.2 5.09999 11.9 5.09999 12.5 5.29999C13.1 5.49999 13.7 5.69999 14.2 6.09999C14.7 6.49999 15.2 6.89999 15.6 7.39999C16 7.89999 16.3 8.49999 16.5 9.09999C16.7 9.69999 16.8 10.4 16.8 11C16.8 11.6 16.7 12.3 16.5 12.9C16.3 13.5 16 14.1 15.7 14.7C15.5 15.3 14.9 15.7 16.1 15.8Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShareDialog = ({
  show,
  onClose,
  shareUrl,
  position,
  title = "Share this content",
  patientInfo,
  individualData,
  onCopyLink,
  onEmailShare,
  onWhatsAppShare,
  hideShareOptions = false, // New prop to control visibility of share options
}) => {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(null);
  const inputRef = useRef(null);

  // Get the full share URL that includes all necessary data
  const getFullShareUrl = () => {
    try {
      // For sharing via copy link
      const baseUrl = window.location.origin + window.location.pathname;
      
      if (individualData) {
        // For safety, limit what data we include in the URL
        // Try using URL parameters instead of encoding the entire object
        const params = new URLSearchParams();
        
        // Add each key individually instead of encoding the whole object
        if (individualData.patientId) {
          params.append('pid', individualData.patientId);
        }
        if (individualData.name) {
          params.append('name', individualData.name);
        }
        // Add any other critical fields
        
        return `${baseUrl}?${params.toString()}`;
      }
      
      // Make sure shareUrl is a complete URL
      if (shareUrl) {
        if (!shareUrl.startsWith('http')) {
          return `${window.location.origin}${shareUrl.startsWith('/') ? '' : '/'}${shareUrl}`;
        }
        return shareUrl;
      }
      
      return baseUrl;
    } catch (error) {
      console.error('Error creating full share URL:', error);
      setShareError("Error generating shareable link. Please try again.");
      return window.location.origin + window.location.pathname;
    }
  };

  const fullShareUrl = getFullShareUrl();

  if (!show) return null;

  const copyLink = () => {
    if (inputRef.current) {
      inputRef.current.select();
      try {
        // Try to use the modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(fullShareUrl)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 3000);
              if (onCopyLink) onCopyLink();
            })
            .catch(err => {
              console.error('Failed to copy with Clipboard API:', err);
              // Fall back to execCommand
              document.execCommand("copy");
              setCopied(true);
              setTimeout(() => setCopied(false), 3000);
              if (onCopyLink) onCopyLink();
            });
        } else {
          // Fall back to old method
          document.execCommand("copy");
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
          if (onCopyLink) onCopyLink();
        }
      } catch (err) {
        console.error('Copy failed:', err);
        setShareError("Failed to copy link. Please try again.");
      }
    }
  };

  const shareViaEmail = () => {
    try {
      const subject = encodeURIComponent("Patient Information");
      const body = encodeURIComponent(
        `I'd like to share this patient information with you: ${fullShareUrl}`
      );
      window.open(`mailto:?subject=${subject}&body=${body}`);

      // Call the prop function if provided
      if (onEmailShare) {
        onEmailShare();
      }
    } catch (error) {
      console.error('Error sharing via email:', error);
      setShareError("Error sharing via email. Please try again.");
    }
  };

  const shareViaWhatsApp = () => {
    try {
      const text = encodeURIComponent(
        `Patient Information: ${fullShareUrl}`
      );
      window.open(`https://wa.me/?text=${text}`);
      // Call the prop function if provided
      if (onWhatsAppShare) {
        onWhatsAppShare();
      }
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      setShareError("Error sharing via WhatsApp. Please try again.");
    }
  };

  return (
    <div className="share-dialog-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="share-dialog-header">
          <h3>{title}</h3>
          <button className="share-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Show any errors that might occur during sharing */}
        {shareError && (
          <div className="share-error-message">
            {shareError}
          </div>
        )}

        {patientInfo && (
          <div className="share-dialog-patient-info">
            <div className="patient-avatar">
              {patientInfo.name ? patientInfo.name.charAt(0) : "?"}
            </div>
            <div className="patient-details-summary">
              <h4>{patientInfo.name || "Patient"}</h4>
              <p>
                ID: {patientInfo.patientId}
                {patientInfo.age ? ` • Age: ${patientInfo.age}` : ''}
                {patientInfo.sex ? ` • ${patientInfo.sex}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Add data preview section to show what's being shared */}
        {individualData && (
          <div className="share-dialog-data-preview">
            <h4>Data being shared:</h4>
            <div className="data-preview">
              {individualData.patientId ? `Patient ID: ${individualData.patientId}` : ''}
              {individualData.name ? `, Name: ${individualData.name}` : ''}
              {individualData.age ? `, Age: ${individualData.age}` : ''}
              {/* Add more fields as needed */}
            </div>
          </div>
        )}

        {!hideShareOptions && (
          <>
            <div className="share-dialog-content">
              <div className="share-dialog-link">
                <label>Share link</label>
                <div className="copy-input-container">
                  <input
                    ref={inputRef}
                    value={fullShareUrl}
                    readOnly
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    className="copy-button"
                    onClick={copyLink}
                    title="Copy to clipboard"
                  >
                    <CopyIcon />
                  </button>
                </div>
              </div>
            </div>

            <div className="share-dialog-options">
              <h4>Or share via</h4>
              <div className="share-methods">
                <button className="share-option" onClick={shareViaEmail}>
                  <EmailIcon />
                  Email
                </button>
                <button className="share-option" onClick={shareViaWhatsApp}>
                  <WhatsAppIcon />
                  WhatsApp
                </button>
              </div>
            </div>

            <div className="share-dialog-footer">
              <p>
                Only data for {patientInfo?.name || 'this patient'} will be accessible with this link
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const ShareIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.59 13.51L15.42 17.49"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.41 6.51L8.59 10.49"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ShareNotification = ({ show }) => {
  if (!show) return null;

  return (
    <div className="share-notification">
      <div className="notification-content">
        <span>✓</span>
        Link copied to clipboard
      </div>
    </div>
  );
};
export default ShareDialog;