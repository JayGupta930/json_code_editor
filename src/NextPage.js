import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NextPage.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';

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
  annotationPlugin  // Register the annotation plugin
);

// Enhanced Close Icon component with better visibility
const CloseIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }} // Ensure icon displays properly
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

function NextPage() {
  const [jsonData, setJsonData] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); 
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('validatedJSON');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setJsonData(parsedData);
      } else {
        alert('No JSON data found. Please upload and validate a JSON file first.');
        navigate('/');
      }
    } catch (e) {
      console.error('Error loading JSON data:', e);
      alert('Error loading JSON data. Please try again.');
      navigate('/');
    }
  }, [navigate]);
  
  const goBack = () => {
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Convert hex color code to RGBA format
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
    if (!jsonData || !jsonData.length) {
      return <p>No patient data available</p>;
    }

    return (
      <div className="patient-cards">
        {jsonData.map((patient) => (
          <div key={patient.patientId} className="patient-card" onClick={() => viewPatientDetails(patient)}>
            <h2>{patient.name}</h2>
            <div className="patient-info">
              <p><strong>ID:</strong> {patient.patientId}</p>
              <p><strong>Age:</strong> {patient.age || 'N/A'}</p>
              <p><strong>Sex:</strong> {patient.sex || 'N/A'}</p>
              <p><strong>Contact:</strong> {patient.contact || 'N/A'}</p>
              <p><strong>Tests:</strong> {patient.cmgTests ? patient.cmgTests.length : 0}</p>
            </div>
            <button className="view-details-btn">View Details</button>
          </div>
        ))}
      </div>
    );
  };

  const renderPatientDetails = () => {
    if (!selectedItem) return null;

    return (
      <div className="modal-overlay" onClick={closePatientDetails}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{selectedItem.name}</h2>
            <button className="modal-close-btn" onClick={closePatientDetails}>
              <CloseIcon />
            </button>
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
    
    // Prepare annotations (text labels + lines)
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
        <h1>Patient CMG Test Data</h1>
        <button className="back-btn" onClick={goBack}>Back to Editor</button>
      </header>
      
      <main>
        {jsonData ? renderPatientCards() : <p>Loading data...</p>}
      </main>
      
      {showDetailModal && renderPatientDetails()}
      {showTestModal && renderTestDetails()}
    </div>
  );
}

export default NextPage;