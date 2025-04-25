import React, { useState } from 'react';
import { ShareOutlined, ContentCopy, Check } from "@mui/icons-material";
import CodeIcon from '@mui/icons-material/Code';
import { Dialog, DialogContent, Box } from '@mui/material';
// import CodeEditor from './CodeEditor';
import CloseIcon from '@mui/icons-material/Close';
import './PatientCard.css';
import { Editor } from '@monaco-editor/react';

const PatientCard = ({ patient, isAdmin, onViewDetails }) => {
  const [activeShareMenu, setActiveShareMenu] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async (e) => {
    e.stopPropagation();
    setActiveShareMenu(!activeShareMenu);
  };

  const handleCodeClick = (e) => {
    e.stopPropagation();
    setCodeDialogOpen(true);
  };

  const handleCodeClose = () => {
    setCodeDialogOpen(false);
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

  const handleCopyJSON = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(patient, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <button
              className="code-button"
              onClick={handleCodeClick}
              title="Code"
            >
              <CodeIcon />
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
      <Dialog
        open={codeDialogOpen}
        onClose={handleCodeClose}
        fullWidth
        maxWidth={false}
        PaperProps={{ 
          style: { width: '90vw', maxWidth: '90vw', height: '80vh', maxHeight: '80vh' },
          className: 'patient-dialog'
        }}
      >
        <Box component="header" className="patient-dialog-header">
          <div className="title-container">
            <h1>
              {patient.name}
              <span className="version">
                ID: {patient.patientId} | Age: {patient.age || 'N/A'} | Sex: {patient.sex || 'N/A'}
              </span>
            </h1>
          </div>
          <div className="controls">
            <button 
              className={`btn copy-btn ${copied ? 'copied' : ''}`} 
              onClick={handleCopyJSON} 
              title="Copy"
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check style={{ fontSize: '16px' }} /> Copied!
                </>
              ) : (
                <>
                  <ContentCopy style={{ fontSize: '16px' }} /> Copy JSON
                </>
              )}
            </button>
            <button className="btn" onClick={handleCodeClose} title="Close">
              <CloseIcon style={{ fontSize: '16px' }} /> Close
            </button>
          </div>
        </Box>
        <DialogContent classes={{ root: 'patient-dialog-content' }}>
        <Editor
          height="calc(70vh - 70px)"
          defaultLanguage="json"
          value={JSON.stringify(patient, null, 2)}
          // onChange={setCode}
          // onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: "on",
            folding: true,
            automaticLayout: true,
            formatOnPaste: true,
            scrollBeyondLastLine: true,
            tabSize: 2,
            renderValidationDecorations: "on",
            colorDecorators: true,
            padding: { top: 10, bottom: 20 },
          }}
        />
          {/* <CodeEditor
            height="100%"
            value={JSON.stringify(patient, null, 2)}
            onChange={() => {}}
            options={{ 
              readOnly: true, 
              minimap: { enabled: false },
              theme: 'vs-light'
            }}
          /> */}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientCard;
