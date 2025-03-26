import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NextPage.css';
import './Card.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import ShareDialog from './ShareDialog';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
  annotationPlugin 
);

// Enhanced Close Icon component with better visibility
const CloseIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}
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

// Add ShareIcon component definition
const ShareIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}
  >
    <path 
      d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37069L8.08261 9.19621C7.54029 8.46785 6.7889 8 5.93426 8C4.3376 8 3 9.34315 3 11C3 12.6569 4.3376 14 5.93426 14C6.7889 14 7.54029 13.5321 8.08261 12.8038L15.0227 16.6293C15.0077 16.7508 15 16.8745 15 17C15 18.6569 16.3431 20 18 20C19.6569 20 21 18.6569 21 17C21 15.3431 19.6569 14 18 14C17.1453 14 16.3939 14.4678 15.8516 15.1962L8.91148 11.3707C8.9265 11.2492 8.93426 11.1255 8.93426 11C8.93426 10.8745 8.9265 10.7508 8.91148 10.6293L15.8516 6.80377C16.3939 7.53215 17.1453 8 18 8Z" 
      fill="currentColor"
    />
  </svg>
);

// Add ShareNotification component
const ShareNotification = ({ show }) => {
  if (!show) return null;
  
  return (
    <div className="share-notification">
      <div className="notification-content">
        Link copied to clipboard!
      </div>
    </div>
  );
};

function NextPage() {
  const [jsonData, setJsonData] = useState(null);
  const [filteredData, setFilteredData] = useState(null); // New state for filtered data
  const [selectedItem, setSelectedItem] = useState(null); 
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  // Add new state variables for sharing functionality
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareDialogPosition, setShareDialogPosition] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [patientToShare, setPatientToShare] = useState(null);
  const [isSharedView, setIsSharedView] = useState(false); // Track if viewing a shared patient
  
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const sharedPatientId = searchParams.get('patientId');
      const encodedData = searchParams.get('data');
      const qrData = searchParams.get('qr');
      
      // First check for full encoded data
      if (encodedData) {
        try {
          const decodedData = JSON.parse(atob(encodedData));
          // Set the decoded data as the json data
          setJsonData([decodedData]); // Wrap in array to maintain expected structure
          setFilteredData([decodedData]);
          setIsSharedView(true);
          // Automatically show this patient's details
          setSelectedItem(decodedData);
          setShowDetailModal(true);
          return; // Skip localStorage check if we have encoded data
        } catch (decodeError) {
          console.error('Error decoding shared data:', decodeError);
          // Continue to check other parameters if decoding fails
        }
      }
      
      // Then check for QR code simplified data
      if (qrData) {
        try {
          const qrDecodedData = JSON.parse(atob(qrData));
          
          // If this is simplified data from a QR code, we need to get the full patient data
          if (qrDecodedData.requiredData) {
            // Use localStorage to find the complete patient data by patientId
            const storedData = localStorage.getItem('validatedJSON');
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              const fullPatientData = parsedData.find(
                patient => patient.patientId === qrDecodedData.patientId
              );
              
              if (fullPatientData) {
                setJsonData(parsedData);
                setFilteredData([fullPatientData]);
                setIsSharedView(true);
                setSelectedItem(fullPatientData);
                setShowDetailModal(true);
                return;
              }
            }
            
            // If we couldn't find the complete data, display a minimal version
            // with what we have from the QR code
            const minimalPatient = {
              patientId: qrDecodedData.patientId,
              name: qrDecodedData.name || 'Unknown Patient',
              qrCodeOnly: true
            };
            
            setJsonData([minimalPatient]);
            setFilteredData([minimalPatient]);
            setIsSharedView(true);
            setSelectedItem(minimalPatient);
            setShowDetailModal(true);
            return;
          }
        } catch (qrDecodeError) {
          console.error('Error decoding QR data:', qrDecodeError);
        }
      }
      
      // Then check for patient ID or use localStorage as before
      // Use localStorage data if no encoded data or if decoding failed
      const storedData = localStorage.getItem('validatedJSON');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setJsonData(parsedData);
        
        // If there's a patientId in the URL, filter the data to show only that patient
        if (sharedPatientId) {
          const filteredPatient = parsedData.find(patient => patient.patientId === sharedPatientId);
          if (filteredPatient) {
            setFilteredData([filteredPatient]);
            setIsSharedView(true);
            // Automatically show this patient's details if it's a shared link
            setSelectedItem(filteredPatient);
            setShowDetailModal(true);
          } else {
            // If patient not found, show a message and display all data
            alert('Shared patient data not found. Showing all available patients.');
            setFilteredData(parsedData);
          }
        } else {
          // No patientId in URL, show all data
          setFilteredData(parsedData);
        }
      } else if (!encodedData) {
        // Only show this alert if we don't have encoded data and no localStorage
        alert('No JSON data found. Please upload and validate a JSON file first.');
        navigate('/');
      }
    } catch (e) {
      console.error('Error loading JSON data:', e);
      alert('Error loading JSON data. Please try again.');
      navigate('/');
    }
  }, [navigate, location]);
  
  const goBack = () => {
    // If viewing a shared patient, going back should clear the filter
    if (isSharedView) {
      setFilteredData(jsonData);
      setIsSharedView(false);
      setShowDetailModal(false);
      // Remove the patient ID from the URL without navigating away
      const newUrl = window.location.pathname;
      window.history.pushState({}, '', newUrl);
      return;
    }
    navigate('/');
  };

  const viewPatientDetails = (patient) => {
    setSelectedItem(patient);
    setShowDetailModal(true);
  };

  const closePatientDetails = () => {
    setShowDetailModal(false);
  };

  const viewTestDetails = (test) => {
    setSelectedTest(test);
    setShowTestModal(true);
  };

  const closeTestDetails = () => {
    setShowTestModal(false);
  };

  // Add new share functionality methods
  const handleShare = (patient, event) => {
    event.stopPropagation(); // Prevent opening the patient details modal
    
    // Create a position near the share button that was clicked
    const rect = event.currentTarget.getBoundingClientRect();
    const position = {
      top: rect.bottom + 10,
      left: rect.left - 300 // Position dialog to the left of the button
    };
    
    // Generate share URL with encoded patient data
    const baseUrl = window.location.origin + window.location.pathname;
    
    // Create a clean patient object for sharing, removing any excessively large data
    // that would cause QR code issues
    const shareablePatient = { ...patient };
    
    // If cmgTests array has large dataPoints arrays, simplify them
    if (shareablePatient.cmgTests && shareablePatient.cmgTests.length > 0) {
      shareablePatient.cmgTests = shareablePatient.cmgTests.map(test => {
        const simplifiedTest = { ...test };
        // Store dataPoints length but not the actual data to reduce size
        if (simplifiedTest.dataPoints && simplifiedTest.dataPoints.length > 20) {
          simplifiedTest.dataPointsCount = simplifiedTest.dataPoints.length;
          simplifiedTest.dataPoints = simplifiedTest.dataPoints.slice(0, 20); // Keep only first 20 points
        }
        return simplifiedTest;
      });
    }
    
    // Encode the patient data in base64
    const encodedData = btoa(JSON.stringify(shareablePatient));
    const shareLink = `${baseUrl}?data=${encodedData}`;
    
    setPatientToShare(patient);
    setShareUrl(shareLink);
    setShareDialogPosition(position);
    setShowShareDialog(true);
  };
  
  const handleCloseShareDialog = () => {
    setShowShareDialog(false);
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        // Show notification
        setShowShareNotification(true);
        // Hide after 3 seconds
        setTimeout(() => {
          setShowShareNotification(false);
        }, 3000);
        
        // Close dialog
        setShowShareDialog(false);
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        alert('Failed to copy link to clipboard');
      });
  };
  
  const handleEmailShare = () => {
    const subject = `Patient Data: ${patientToShare?.name || 'Patient'}`;
    const body = `View patient data at: ${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowShareDialog(false);
  };
  
  const handleWhatsAppShare = () => {
    const text = `View patient data: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShowShareDialog(false);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const hexToRgba = (hexColor, opacity = 1) => {
    if (!hexColor) return 'rgba(0, 0, 0, 1)';
    
    // For decimal color values
    if (typeof hexColor === 'number') {
      const r = (hexColor >> 16) & 255;
      const g = (hexColor >> 8) & 255;
      const b = hexColor & 255;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // For hex color strings
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const renderPatientCards = () => {
    if (!filteredData || !filteredData.length) {
      return <p>No patient data available</p>;
    }

    return (
      <div className="patient-cards">
        {filteredData.map((patient) => {
          return (
            <div key={patient.patientId} className="patient-card" onClick={() => viewPatientDetails(patient)}>
              <div className="card-header-actions">
                <h2>{patient.name}</h2>
                <button 
                  className="share-btn" 
                  onClick={(e) => handleShare(patient, e)}
                  title="Share patient data"
                >
                  <ShareIcon />
                </button>
              </div>
              <div className="patient-info">
                <p><strong>ID:</strong> {patient.patientId}</p>
                <p><strong>Age:</strong> {patient.age || 'N/A'}</p>
                <p><strong>Sex:</strong> {patient.sex || 'N/A'}</p>
                <p><strong>Contact:</strong> {patient.contact || 'N/A'}</p>
                <p><strong>Tests:</strong> {patient.cmgTests ? patient.cmgTests.length : 0}</p>
              </div>
              <button className="view-details-btn">View Details</button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPatientDetails = () => {
    if (!selectedItem) return null;

    // Special rendering for patients coming from QR codes with minimal data
    if (selectedItem.qrCodeOnly) {
      return (
        <div className="modal-overlay" onClick={closePatientDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedItem.name}</h2>
              <button className="modal-close-btn" onClick={closePatientDetails}>
                <CloseIcon />
              </button>
            </div>
            <div className="minimal-patient-info">
              <p>Patient ID: {selectedItem.patientId}</p>
              <p className="limited-data-notice">
                Limited patient data is available from this QR code. 
                For complete patient information, please ask the sender to share the full link instead.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Regular patient details rendering
    return (
      <div className="modal-overlay" onClick={closePatientDetails}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{selectedItem.name}</h2>
            <div className="modal-header-actions">
              <button className="modal-close-btn" onClick={closePatientDetails}>
                <CloseIcon />
              </button>
            </div>
          </div>
          <div className="patient-details">
            <div className="details-column">
              <p><strong>ID:</strong> {selectedItem.patientId}</p>
              <p><strong>Age:</strong> {selectedItem.age || 'N/A'}</p>
              <p><strong>Sex:</strong> {selectedItem.sex || 'N/A'}</p>
              <p><strong>Height:</strong> {selectedItem.height || 'N/A'}</p>
              <p><strong>Weight:</strong> {selectedItem.weight || 'N/A'}</p>
            </div>
            <div className="details-column">
              <p><strong>Contact:</strong> {selectedItem.contact || 'N/A'}</p>
              <p><strong>Marital Status:</strong> {selectedItem.maritalStatus || 'N/A'}</p>
              <p><strong>Created:</strong> {formatDate(selectedItem.createdAt)}</p>
              <p><strong>Aadhaar:</strong> {selectedItem.aadhaar || 'N/A'}</p>
              <p><strong>Doctor ID:</strong> {selectedItem.doctorId || 'N/A'}</p>
            </div>
          </div>
          
          <div className="medical-section">
            <h3>Medical History</h3>
            <p>{selectedItem.medicalHistory || 'No medical history recorded'}</p>
            
            <h3>Symptoms</h3>
            {selectedItem.symptoms && selectedItem.symptoms.length > 0 ? (
              <ul>
                {selectedItem.symptoms.map((symptom, index) => (
                  <li key={index}>{symptom}</li>
                ))}
              </ul>
            ) : (
              <p>No symptoms recorded</p>
            )}
          </div>
          
          <h3>CMG Tests ({selectedItem.cmgTests ? selectedItem.cmgTests.length : 0})</h3>
          <div className="tests-container">
            {selectedItem.cmgTests && selectedItem.cmgTests.map((test, index) => (
              <div key={index} className="test-card" onClick={() => viewTestDetails(test)}>
                <h4>Test #{index + 1}</h4>
                <p><strong>Date:</strong> {formatDate(test.createdAt)}</p>
                <p><strong>Notes:</strong> {test.notes ? test.notes.length : 0}</p>
                <p><strong>Data Points:</strong> {test.dataPoints ? test.dataPoints.length : 0}</p>
                <button className="view-test-btn">View Test Data</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTestDetails = () => {
    if (!selectedTest) return null;

    // Prepare chart data
    const labels = Array.from({ length: selectedTest.dataPoints.length }, (_, i) => i + 1);
    
    const annotations = {};
    
    // Create a pointRadius array with all zeros by default
    const pointRadiusArray = new Array(selectedTest.dataPoints.length).fill(0);
    
    // Add annotations from notes
    if (selectedTest.notes && selectedTest.notes.length > 0) {
      selectedTest.notes.forEach((note, index) => {
        // Set the point radius to 6 at the timestamp position
        if (note.timestamp >= 0 && note.timestamp < pointRadiusArray.length) {
          pointRadiusArray[note.timestamp] = 6;
        }
        
        // Add point annotation
        annotations[`point${index}`] = {
          type: 'point',
          xValue: note.timestamp,
          yValue: note.pressure,
          backgroundColor: hexToRgba(note.color, 0.7),
          borderColor: hexToRgba(note.color),
          borderWidth: 2,
          radius: 6
        };
        
        // Add label annotation
        annotations[`label${index}`] = {
          type: 'label',
          xValue: note.timestamp,
          yValue: note.pressure,
          content: note.note,
          backgroundColor: 'white',
          color: '#333',
          borderColor: hexToRgba(note.color),
          borderWidth: 1,
          borderRadius: 4,
          position: 'top',
          xAdjust: 0,
          yAdjust: -15,
          font: {
            size: 12
          },
          padding: 6
        };
        
        // Add line annotation (vertical line at timestamp)
        annotations[`line${index}`] = {
          type: 'line',
          xMin: note.timestamp,
          xMax: note.timestamp,
          borderColor: hexToRgba(note.color, 0.5),
          borderWidth: 1,
          borderDash: [5, 5],
          label: {
            display: false
          }
        };
      });
    }
    
    // Add other annotations similar to the example
    // Horizontal "Target" line
    annotations.targetLine = {
      type: 'line', 
      yMin: selectedTest.targetPressure || Math.max(...selectedTest.dataPoints) * 0.75,
      yMax: selectedTest.targetPressure || Math.max(...selectedTest.dataPoints) * 0.75,
      borderColor: 'rgba(46, 134, 193, 0.8)',
      borderWidth: 2,
      borderDash: [5, 5],
      label: {
        display: true,
        content: 'Target',
        position: 'start',
        backgroundColor: 'rgba(46, 134, 193, 0.8)',
        font: {
          size: 12,
          weight: 'bold'
        }
      }
    };
    
    // Add a Y-axis range marker for "normal" values if applicable
    if (selectedTest.normalRangeLow && selectedTest.normalRangeHigh) {
      annotations.normalRange = {
        type: 'box',
        yMin: selectedTest.normalRangeLow,
        yMax: selectedTest.normalRangeHigh,
        backgroundColor: 'rgba(144, 238, 144, 0.2)',
        borderColor: 'rgba(144, 238, 144, 0.8)',
        borderWidth: 1,
        label: {
          display: true,
          content: 'Normal Range',
          position: 'start',
          backgroundColor: 'rgba(144, 238, 144, 0.8)',
          color: '#000',
          font: {
            size: 11
          }
        }
      };
    }

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Pressure',
          data: selectedTest.dataPoints,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.4)',
          pointRadius: pointRadiusArray, // Use the custom pointRadius array
          pointHoverRadius: 8, // Larger points on hover
          pointBackgroundColor: 'rgba(75, 192, 192, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          tension: 0.3,
          fill: true,
          borderWidth: 2
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            // Custom tooltip to highlight when there's a note
            title: function(context) {
              const index = context[0].dataIndex;
              if (pointRadiusArray[index] > 0) {
                return `Time ${index} - Note Available`;
              }
              return `Time ${index}`;
            }
          }
        },
        legend: {
          position: 'top',
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'x',
            scaleMode: 'x',
          },
          pan: {
            enabled: true,
            mode: 'x',
            scaleMode: 'x',
          },
          limits: {
            x: {min: 'original', max: 'original'},
            y: {min: 'original', max: 'original', minRange: 1}
          }
        },
        title: {
          display: true,
          text: 'Test Data Points'
        },
        annotation: {
          annotations: annotations
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time'
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Pressure'
          },
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      elements: {
        point: {
          radius: 0, // Default radius is 0 (no points shown)
          hitRadius: 10, // Area around point that will register hover events
        }
      }
    };

    return (
      <div className="modal-overlay" onClick={closeTestDetails}>
        <div className="modal-content test-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Test Details</h2>
            <button className="modal-close-btn" onClick={closeTestDetails}>
              <CloseIcon />
            </button>
          </div>
          <p><strong>Date:</strong> {formatDate(selectedTest.createdAt)}</p>
          
          <div className="clinical-notes">
            <p><strong>Pre-Clinical Notes:</strong> {selectedTest.preClinicalNotes || 'None'}</p>
            <p><strong>Post-Clinical Notes:</strong> {selectedTest.postClinicalNotes || 'None'}</p>
            <p><strong>Leakage Volume:</strong> {selectedTest.leakageVolume || 0}</p>
            <p><strong>Bladder Capacity:</strong> {selectedTest.bladderCapacity || 'N/A'}</p>
            <p><strong>Post Void Residue:</strong> {selectedTest.postVoidResidue || 0}</p>
          </div>
          
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} height={400} />
            <div className="chart-controls">
              <button onClick={() => {
                const chart = document.querySelector('.chart-container canvas');
                if (chart) {
                  const chartInstance = ChartJS.getChart(chart);
                  chartInstance.resetZoom();
                }
              }}>
                Reset Zoom
              </button>
            </div>
          </div>
          
          <div className="notes-section">
            <h3>Test Notes</h3>
            {selectedTest.notes && selectedTest.notes.length > 0 ? (
              <div className="notes-list">
                {selectedTest.notes.map((note, index) => (
                  <div 
                    key={index} 
                    className="note-item"
                    style={{ borderLeft: `4px solid ${hexToRgba(note.color)}` }}
                  >
                    <p><strong>Time:</strong> {note.timestamp}</p>
                    <p><strong>Note:</strong> {note.note}</p>
                    <p><strong>Pressure:</strong> {note.pressure}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No notes available for this test</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="next-page">
      <header>
        <h1>
          {isSharedView 
            ? `Patient Data: ${filteredData?.[0]?.name || 'Patient'}`
            : 'Patient CMG Test Data'
          }
        </h1>
        <div className="header-actions">
          {isSharedView && (
            <div className="shared-view-indicator">
              <span className="shared-badge">Shared View</span>
            </div>
          )}
          <button className="back-btn" onClick={goBack}>
            {isSharedView ? 'View All Patients' : 'Back to Editor'}
          </button>
        </div>
      </header>
      
      <main>
        {filteredData ? renderPatientCards() : <p>Loading data...</p>}
      </main>
      
      {showDetailModal && renderPatientDetails()}
      {showTestModal && renderTestDetails()}
      
      {/* Add ShareDialog component */}
      <ShareDialog 
        show={showShareDialog}
        onClose={handleCloseShareDialog}
        patient={patientToShare}
        shareUrl={shareUrl}
        position={shareDialogPosition}
        onCopyLink={handleCopyLink}
        onEmailShare={handleEmailShare}
        onWhatsAppShare={handleWhatsAppShare}
      />
      
      {/* Add ShareNotification component */}
      <ShareNotification show={showShareNotification} />
    </div>
  );
}
export default NextPage;