import React from 'react';
import './PatientCard.css';

// Enhanced Close Icon component with better visibility
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

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString();
};

const PatientDetailsModal = ({ patient, onClose, onViewTest }) => {
  if (!patient) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{patient.name}</h2>
          <div className="modal-header-actions">
            <button className="modal-close-btn" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className="patient-details">
          <div className="details-column">
            <p><strong>ID:</strong> {patient.patientId}</p>
            <p><strong>Age:</strong> {patient.age || "N/A"}</p>
            <p><strong>Sex:</strong> {patient.sex || "N/A"}</p>
            <p><strong>Height:</strong> {patient.height || "N/A"}</p>
            <p><strong>Weight:</strong> {patient.weight || "N/A"}</p>
          </div>
          <div className="details-column">
            <p><strong>Contact:</strong> {patient.contact || "N/A"}</p>
            <p><strong>Marital Status:</strong> {patient.maritalStatus || "N/A"}</p>
            <p><strong>Created:</strong> {formatDate(patient.createdAt)}</p>
            <p><strong>Aadhaar:</strong> {patient.aadhaar || "N/A"}</p>
            <p><strong>Doctor ID:</strong> {patient.doctorId || "N/A"}</p>
          </div>
        </div>

        <div className="medical-section">
          <h3>Medical History</h3>
          <p>{patient.medicalHistory || "No medical history recorded"}</p>

          <h3>Symptoms</h3>
          {patient.symptoms && patient.symptoms.length > 0 ? (
            <ul>
              {patient.symptoms.map((symptom, index) => (
                <li key={index}>{symptom}</li>
              ))}
            </ul>
          ) : (
            <p>No symptoms recorded</p>
          )}
        </div>

        <h3>CMG Tests ({patient.cmgTests ? patient.cmgTests.length : 0})</h3>
        <div className="tests-container">
          {patient.cmgTests &&
            patient.cmgTests.map((test, index) => (
              <div
                key={index}
                className="test-card"
                onClick={() => onViewTest(test)}
              >
                <h4>Test #{index + 1}</h4>
                <p><strong>Date:</strong> {formatDate(test.createdAt)}</p>
                <p><strong>Notes:</strong> {test.notes ? test.notes.length : 0}</p>
                <p>
                  <strong>Data Points:</strong>{" "}
                  {test.dataPoints ? test.dataPoints.length : 0}
                </p>
                <button className="view-test-btn">View Test Data</button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;