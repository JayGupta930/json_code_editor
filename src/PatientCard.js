import React, { useState } from 'react';
import { ShareOutlined, ContentCopy } from "@mui/icons-material";
import './PatientCard.css';

const PatientCard = ({ patient, isAdmin, onViewDetails }) => {
  const [activeShareMenu, setActiveShareMenu] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleShare = async (e) => {
    e.stopPropagation();
    setActiveShareMenu(!activeShareMenu);
  };

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    try {
      const shareableData = {
        patientId: patient.patientId,
        name: patient.name,
        age: patient.age,
        sex: patient.sex,
        cmgTests: patient.cmgTests,
      };

      // Store in sessionStorage for sharing
      sessionStorage.setItem(
        `shared-${patient.patientId}`,
        JSON.stringify(shareableData)
      );

      // Create and copy shareable URL
      const shareableUrl = `${window.location.origin}/shared/${patient.patientId}`;
      await navigator.clipboard.writeText(shareableUrl);

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // Close share menu
      setActiveShareMenu(false);
    } catch (err) {
      console.error("Error copying share link:", err);
      alert("Failed to create share link");
    }
  };

  return (
    <div className="patient-card">
      <div className="card-header-actions">
        <h2>{patient.name}</h2>
        {isAdmin && (
          <div className="share-container">
            <button
              className="share-button"
              onClick={handleShare}
              title="Share"
            >
              <ShareOutlined />
            </button>
            <div className={`share-menu ${activeShareMenu ? "visible" : ""}`}>
              <div
                className="share-menu-item"
                onClick={handleCopyLink}
              >
                <ContentCopy fontSize="small" />
                Copy Link
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        className="patient-info"
        onClick={() => onViewDetails(patient)}
      >
        <p>
          <strong>ID:</strong> {patient.patientId}
        </p>
        <p>
          <strong>Age:</strong> {patient.age || "N/A"}
        </p>
        <p>
          <strong>Sex:</strong> {patient.sex || "N/A"}
        </p>
        <p>
          <strong>Contact:</strong> {patient.contact || "N/A"}
        </p>
        <p>
          <strong>Tests:</strong> {patient.cmgTests ? patient.cmgTests.length : 0}
        </p>
      </div>
      <button className="view-details-btn" onClick={() => onViewDetails(patient)}>
        View Details
      </button>
      {showSuccessMessage && (
        <div className="share-success visible">
          Link copied successfully!
        </div>
      )}
    </div>
  );
};

export default PatientCard;
