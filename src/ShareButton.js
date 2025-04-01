import React, { useState } from "react";
import ShareDialog, { ShareIcon, ShareNotification } from "./ShareDialog";

const ShareButton = ({ contentId, title, individualData, patientInfo }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showNotification, setShowNotification] = useState(false);

  // Generate a unique share URL based on the individual data
  const generateShareUrl = () => {
    // Create a URL with only the individual data that needs to be shared
    const baseUrl = `${window.location.origin}/view/${contentId}`;

    // If there's individual data, encode it in the URL
    if (individualData) {
      // Convert data to base64 to avoid URL encoding issues
      const encodedData = btoa(JSON.stringify(individualData));
      return `${baseUrl}?data=${encodedData}`;
    }

    return baseUrl;
  };

  const shareUrl = generateShareUrl();

  const handleShareClick = (e) => {
    setPosition({
      top: "50%",
      left: "50%",
    });
    setShowDialog(true);
  };

  const handleClose = () => {
    setShowDialog(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
    setShowDialog(false);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(title || "Shared content");
    const body = encodeURIComponent(
      `I thought you might be interested in this: ${shareUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setShowDialog(false);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check out this content: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`);
    setShowDialog(false);
  };

  return (
    <>
      <button className="share-btn" onClick={handleShareClick} title="Share">
        <ShareIcon />
      </button>

      <ShareDialog
        show={showDialog}
        onClose={handleClose}
        shareUrl={shareUrl}
        position={position}
        title={title || "Share this content"}
        onCopyLink={handleCopyLink}
        onEmailShare={handleEmailShare}
        onWhatsAppShare={handleWhatsAppShare}
        patientInfo={patientInfo}
        individualData={individualData}
      />

      <ShareNotification show={showNotification} />
    </>
  );
};

export default ShareButton;
