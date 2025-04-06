import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Visualize.css";
import "./Card.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  SubTitle,
  TimeScale,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import annotationPlugin from "chartjs-plugin-annotation";
import "chartjs-adapter-date-fns";
import { secondsToHumanReadable } from "./utils/timeUtils";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  SubTitle,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
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

function Visualize() {
  const location = useLocation();
  const navigate = useNavigate();
  const chartRef = useRef(null);

  const [jsonData] = useState(location.state?.data || null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [chartType, setChartType] = useState("smooth"); // 'smooth', 'linear', 'stepped'
  const [compareMode, setCompareMode] = useState(false);
  const [compareWith, setCompareWith] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const [statsHighlight, setStatsHighlight] = useState("none"); // 'none', 'anomalies', 'trends'

  // Remove the redirect and alert block, the UI will handle the no-data state
  const goBack = () => {
    navigate("/");
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
    setCompareWith(null); // Reset comparison when viewing a new test
    setShowTestModal(true);
  };

  const closeTestDetails = () => {
    setShowTestModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const hexToRgba = (hexColor, opacity = 1) => {
    if (!hexColor) return "rgba(0, 0, 0, 1)";

    // For decimal color values
    if (typeof hexColor === "number") {
      const r = (hexColor >> 16) & 255;
      const g = (hexColor >> 8) & 255;
      const b = hexColor & 255;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // For hex color strings
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // New function to calculate statistics
  const calculateStats = (dataPoints) => {
    if (!dataPoints || dataPoints.length === 0) return {};

    const sum = dataPoints.reduce((a, b) => a + b, 0);
    const avg = sum / dataPoints.length;
    const sortedPoints = [...dataPoints].sort((a, b) => a - b);
    const median = sortedPoints[Math.floor(dataPoints.length / 2)];
    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);

    // Calculate standard deviation
    const squareDiffs = dataPoints.map((value) => {
      const diff = value - avg;
      return diff * diff;
    });
    const avgSquareDiff =
      squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    // Calculate rates of change (trend)
    const rateOfChange = [];
    for (let i = 1; i < dataPoints.length; i++) {
      rateOfChange.push(dataPoints[i] - dataPoints[i - 1]);
    }

    const avgRateOfChange =
      rateOfChange.reduce((a, b) => a + b, 0) / rateOfChange.length;

    // Identify anomalies (values outside 2 standard deviations)
    const anomalies = dataPoints
      .map((point, index) => {
        return Math.abs(point - avg) > 2 * stdDev ? index : -1;
      })
      .filter((index) => index !== -1);

    return {
      mean: avg.toFixed(2),
      median: median.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      stdDev: stdDev.toFixed(2),
      avgRateOfChange: avgRateOfChange.toFixed(2),
      anomalies,
    };
  };

  const renderPatientCards = () => {
    if (!jsonData || !jsonData.length) {
      return <p>No patient data available</p>;
    }

    return (
      <div className="patient-cards">
        {jsonData.map((patient) => {
          return (
            <div
              key={patient.patientId}
              className="patient-card"
              onClick={() => viewPatientDetails(patient)}
            >
              <div className="card-header-actions">
                <h2>{patient.name}</h2>
              </div>
              <div className="patient-info">
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
                  <strong>Tests:</strong>{" "}
                  {patient.cmgTests ? patient.cmgTests.length : 0}
                </p>
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
              <p>
                <strong>ID:</strong> {selectedItem.patientId}
              </p>
              <p>
                <strong>Age:</strong> {selectedItem.age || "N/A"}
              </p>
              <p>
                <strong>Sex:</strong> {selectedItem.sex || "N/A"}
              </p>
              <p>
                <strong>Height:</strong> {selectedItem.height || "N/A"}
              </p>
              <p>
                <strong>Weight:</strong> {selectedItem.weight || "N/A"}
              </p>
            </div>
            <div className="details-column">
              <p>
                <strong>Contact:</strong> {selectedItem.contact || "N/A"}
              </p>
              <p>
                <strong>Marital Status:</strong>{" "}
                {selectedItem.maritalStatus || "N/A"}
              </p>
              <p>
                <strong>Created:</strong> {formatDate(selectedItem.createdAt)}
              </p>
              <p>
                <strong>Aadhaar:</strong> {selectedItem.aadhaar || "N/A"}
              </p>
              <p>
                <strong>Doctor ID:</strong> {selectedItem.doctorId || "N/A"}
              </p>
            </div>
          </div>

          <div className="medical-section">
            <h3>Medical History</h3>
            <p>
              {selectedItem.medicalHistory || "No medical history recorded"}
            </p>

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

          <h3>
            CMG Tests (
            {selectedItem.cmgTests ? selectedItem.cmgTests.length : 0})
          </h3>
          <div className="tests-container">
            {selectedItem.cmgTests &&
              selectedItem.cmgTests.map((test, index) => (
                <div
                  key={index}
                  className="test-card"
                  onClick={() => viewTestDetails(test)}
                >
                  <h4>Test #{index + 1}</h4>
                  <p>
                    <strong>Date:</strong> {formatDate(test.createdAt)}
                  </p>
                  <p>
                    <strong>Notes:</strong> {test.notes ? test.notes.length : 0}
                  </p>
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

  const createGradient = (ctx, area, colorStart, colorEnd) => {
    const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  };

  const renderTestDetails = () => {
    if (!selectedTest) return null;

    // Calculate statistics
    const stats = calculateStats(selectedTest.dataPoints);

    // Prepare chart data
    const labels = Array.from(
      { length: selectedTest.dataPoints.length },
      (_, i) => i + 1
    );

    const annotations = {};

    // Create a pointRadius array with all zeros by default
    const pointRadiusArray = new Array(selectedTest.dataPoints.length).fill(0);

    // Mark anomalies if requested
    if (statsHighlight === "anomalies" && stats.anomalies) {
      stats.anomalies.forEach((index) => {
        pointRadiusArray[index] = 5;

        // Add anomaly annotation
        annotations[`anomaly${index}`] = {
          type: "point",
          xValue: index,
          yValue: selectedTest.dataPoints[index],
          backgroundColor: "rgba(255, 99, 132, 0.7)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 2,
          radius: 6,
        };
      });
    }

    // Add annotations from notes
    if (selectedTest.notes && selectedTest.notes.length > 0) {
      selectedTest.notes.forEach((note, index) => {
        // Set the point radius to 6 at the timestamp position
        if (note.timestamp >= 0 && note.timestamp < pointRadiusArray.length) {
          pointRadiusArray[note.timestamp] = 6;
        }

        // Add point annotation
        annotations[`point${index}`] = {
          type: "point",
          xValue: note.timestamp,
          yValue: note.pressure,
          backgroundColor: hexToRgba(note.color, 0.7),
          borderColor: hexToRgba(note.color),
          borderWidth: 2,
          radius: 6,
        };

        // Add label annotation
        annotations[`label${index}`] = {
          type: "label",
          xValue: note.timestamp,
          yValue: note.pressure,
          content: note.note,
          backgroundColor: "white",
          color: "#333",
          borderColor: hexToRgba(note.color),
          borderWidth: 1,
          borderRadius: 4,
          position: "top",
          xAdjust: 0,
          yAdjust: -15,
          font: {
            size: 12,
          },
          padding: 6,
        };

        // Add line annotation (vertical line at timestamp)
        annotations[`line${index}`] = {
          type: "line",
          xMin: note.timestamp,
          xMax: note.timestamp,
          borderColor: hexToRgba(note.color, 0.5),
          borderWidth: 1,
          borderDash: [5, 5],
          label: {
            display: false,
          },
        };
      });
    }

    // Add mean line annotation
    if (showStats && stats.mean) {
      annotations.meanLine = {
        type: "line",
        yMin: parseFloat(stats.mean),
        yMax: parseFloat(stats.mean),
        borderColor: "rgba(255, 159, 64, 0.7)",
        borderWidth: 2,
        borderDash: [5, 5],
        label: {
          display: true,
          content: `Mean: ${stats.mean}`,
          position: "start",
          backgroundColor: "rgba(255, 159, 64, 0.7)",
          font: {
            size: 12,
            weight: "bold",
          },
        },
      };
    }

    // Add other annotations similar to the example
    // Horizontal "Target" line
    annotations.targetLine = {
      type: "line",
      yMin:
        selectedTest.targetPressure ||
        Math.max(...selectedTest.dataPoints) * 0.75,
      yMax:
        selectedTest.targetPressure ||
        Math.max(...selectedTest.dataPoints) * 0.75,
      borderColor: "rgba(46, 134, 193, 0.8)",
      borderWidth: 2,
      borderDash: [5, 5],
      label: {
        display: true,
        content: "Target",
        position: "start",
        backgroundColor: "rgba(46, 134, 193, 0.8)",
        font: {
          size: 12,
          weight: "bold",
        },
      },
    };

    // Add a Y-axis range marker for "normal" values if applicable
    if (selectedTest.normalRangeLow && selectedTest.normalRangeHigh) {
      annotations.normalRange = {
        type: "box",
        yMin: selectedTest.normalRangeLow,
        yMax: selectedTest.normalRangeHigh,
        backgroundColor: "rgba(144, 238, 144, 0.2)",
        borderColor: "rgba(144, 238, 144, 0.8)",
        borderWidth: 1,
        label: {
          display: true,
          content: "Normal Range",
          position: "start",
          backgroundColor: "rgba(144, 238, 144, 0.8)",
          color: "#000",
          font: {
            size: 11,
          },
        },
      };
    }

    // Prepare datasets
    const datasets = [
      {
        label: "Pressure",
        data: selectedTest.dataPoints,
        borderColor: function (context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            // This can happen when the chart is not yet rendered
            return "rgba(75, 192, 192, 1)";
          }
          // Gradient for the main line
          return createGradient(
            ctx,
            chartArea,
            "rgba(75, 192, 192, 0.8)",
            "rgba(75, 192, 192, 1)"
          );
        },
        backgroundColor: function (context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            return "rgba(75, 192, 192, 0.4)";
          }
          // Gradient fill
          return createGradient(
            ctx,
            chartArea,
            "rgba(75, 192, 192, 0.1)",
            "rgba(75, 192, 192, 0.5)"
          );
        },
        pointRadius: pointRadiusArray,
        pointHoverRadius: 8,
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 1,
        tension:
          chartType === "smooth" ? 0.4 : chartType === "stepped" ? 0 : 0.1,
        fill: true,
        borderWidth: 2,
        stepped: chartType === "stepped",
      },
    ];

    // Add comparison dataset if needed
    if (compareMode && compareWith && compareWith.dataPoints) {
      datasets.push({
        label: "Comparison",
        data: compareWith.dataPoints,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        pointRadius: 0,
        pointHoverRadius: 6,
        tension:
          chartType === "smooth" ? 0.4 : chartType === "stepped" ? 0 : 0.1,
        fill: false,
        borderWidth: 2,
        borderDash: [5, 5],
        stepped: chartType === "stepped",
      });

      // Add comparison date annotation
      annotations.comparisonDate = {
        type: "label",
        xValue: compareWith.dataPoints.length / 2,
        yValue: Math.max(...compareWith.dataPoints),
        content: `Comparison: ${formatDate(compareWith.createdAt || "N/A")}`,
        backgroundColor: "rgba(255, 99, 132, 0.7)",
        color: "white",
        borderRadius: 4,
        font: {
          size: 12,
          weight: "bold",
        },
        padding: 6,
      };
    }

    const chartData = {
      labels: labels,
      datasets: datasets,
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            // Custom tooltip to highlight when there's a note
            title: function (context) {
              const index = context[0].dataIndex;
              if (pointRadiusArray[index] > 0) {
                return `Time ${secondsToHumanReadable(index)} - Note Available`;
              }
              return `Time ${secondsToHumanReadable(index)}`;
            },
            // Add rate of change
            afterLabel: function (context) {
              const index = context.dataIndex;
              const dataset = context.dataset.data;

              if (index > 0) {
                const change = dataset[index] - dataset[index - 1];
                const percentChange = (
                  (change / dataset[index - 1]) *
                  100
                ).toFixed(1);
                return `Change: ${change.toFixed(2)} (${percentChange}%)`;
              }
              return "";
            },
          },
          // Make the tooltip more visually appealing
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: "rgba(75, 192, 192, 0.8)",
          borderWidth: 1,
          padding: 10,
          bodyFont: {
            size: 13,
          },
          titleFont: {
            size: 14,
            weight: "bold",
          },
          boxPadding: 5,
          usePointStyle: true,
        },
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 13,
            },
          },
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: "xy",
            scaleMode: "xy",
            overScaleMode: "y",
          },
          pan: {
            enabled: true,
            mode: "xy",
            scaleMode: "xy",
          },
          limits: {
            x: { min: "original", max: "original" },
            y: { min: "original", max: "original", minRange: 1 },
          },
        },
        title: {
          display: true,
          text: "Pressure Monitoring",
          font: {
            size: 18,
            weight: "bold",
          },
          padding: {
            top: 10,
            bottom: 10,
          },
        },
        subtitle: {
          display: true,
          text: `Test Date: ${formatDate(selectedTest.createdAt)}`,
          padding: {
            bottom: 20,
          },
        },
        annotation: {
          annotations: annotations,
        },
        // Crosshair on hover
        crosshair: {
          line: {
            color: "rgba(0, 0, 0, 0.3)",
            width: 1,
            dashPattern: [5, 5],
          },
          sync: {
            enabled: true,
            group: 1,
          },
          zoom: {
            enabled: true,
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Time",
            font: {
              size: 14,
              weight: "bold",
            },
            padding: { top: 10, bottom: 0 },
          },
          grid: {
            display: true,
            color: "rgba(0, 0, 0, 0.05)",
            drawBorder: true,
            borderDash: [5, 5],
          },
          ticks: {
            callback: function (value) {
              // More readable x-axis labels
              if (value % 2 === 0 || value === 1) {
                return secondsToHumanReadable(value);
              }
              return "";
            },
            maxRotation: 0,
            padding: 5,
          },
        },
        y: {
          title: {
            display: true,
            text: "Pressure",
            font: {
              size: 14,
              weight: "bold",
            },
            padding: { top: 0, bottom: 10 },
          },
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
            drawBorder: true,
            borderDash: [5, 5],
          },
          ticks: {
            padding: 5,
          },
        },
      },
      elements: {
        point: {
          radius: 0, // Default radius is 0 (no points shown)
          hitRadius: 10, // Area around point that will register hover events
        },
        line: {
          cubicInterpolationMode: "monotone", // More natural curves
        },
      },
      animation: {
        duration: 1000, // Smooth animation for better visual appeal
        easing: "easeOutQuart",
      },
      transitions: {
        zoom: {
          animation: {
            duration: 500,
          },
        },
      },
    };

    // Prepare comparison options
    const comparisonOptions = [];
    if (selectedItem && selectedItem.cmgTests) {
      selectedItem.cmgTests.forEach((test, index) => {
        if (test !== selectedTest) {
          comparisonOptions.push({
            id: index,
            date: formatDate(test.createdAt),
            test: test,
          });
        }
      });
    }

    return (
      <div className="modal-overlay" onClick={closeTestDetails}>
        <div
          className="modal-content test-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Test Details</h2>
            <button className="modal-close-btn" onClick={closeTestDetails}>
              <CloseIcon />
            </button>
          </div>
          <p>
            <strong>Date:</strong> {formatDate(selectedTest.createdAt)}
          </p>

          <div className="clinical-notes">
            <p>
              <strong>Pre-Clinical Notes:</strong>{" "}
              {selectedTest.preClinicalNotes || "None"}
            </p>
            <p>
              <strong>Post-Clinical Notes:</strong>{" "}
              {selectedTest.postClinicalNotes || "None"}
            </p>
            <p>
              <strong>Leakage Volume:</strong> {selectedTest.leakageVolume || 0}
            </p>
            <p>
              <strong>Bladder Capacity:</strong>{" "}
              {selectedTest.bladderCapacity || "N/A"}
            </p>
            <p>
              <strong>Post Void Residue:</strong>{" "}
              {selectedTest.postVoidResidue || 0}
            </p>
          </div>

          {/* Chart controls */}
          <div className="chart-controls">
            <div className="control-group">
              <label>Line Type:</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="chart-select"
              >
                <option value="smooth">Smooth</option>
                <option value="linear">Linear</option>
                <option value="stepped">Stepped</option>
              </select>
            </div>

            <div className="control-group">
              <label>Analysis:</label>
              <select
                value={statsHighlight}
                onChange={(e) => setStatsHighlight(e.target.value)}
                className="chart-select"
              >
                <option value="none">None</option>
                <option value="anomalies">Highlight Anomalies</option>
                <option value="trends">Show Trends</option>
              </select>
            </div>

            <div className="control-group">
              <label>Compare:</label>
              <select
                className="chart-select"
                onChange={(e) => {
                  if (e.target.value === "none") {
                    setCompareMode(false);
                    setCompareWith(null);
                  } else {
                    const selectedOption = comparisonOptions.find(
                      (option) => option.id.toString() === e.target.value
                    );
                    if (selectedOption) {
                      setCompareMode(true);
                      setCompareWith(selectedOption.test);
                    }
                  }
                }}
              >
                <option value="none">No Comparison</option>
                {comparisonOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.date}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="chart-button"
              onClick={() => {
                const chart = chartRef.current;
                if (chart) {
                  chart.resetZoom();
                }
              }}
            >
              Reset View
            </button>
          </div>

          {/* Statistics Panel */}
          {showStats && (
            <div className="stats-panel">
              <h3>Statistical Analysis</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Mean:</span>
                  <span className="stat-value">{stats.mean}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Median:</span>
                  <span className="stat-value">{stats.median}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Min:</span>
                  <span className="stat-value">{stats.min}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Max:</span>
                  <span className="stat-value">{stats.max}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Std Dev:</span>
                  <span className="stat-value">{stats.stdDev}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Trend:</span>
                  <span className="stat-value">{stats.avgRateOfChange}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Anomalies:</span>
                  <span className="stat-value">
                    {stats.anomalies ? stats.anomalies.length : 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="chart-container">
            <Line
              data={chartData}
              options={chartOptions}
              height={400}
              ref={chartRef}
            />
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
                    <p>
                      <strong>Time:</strong>{" "}
                      {secondsToHumanReadable(note.timestamp)}
                    </p>
                    <p>
                      <strong>Note:</strong> {note.note}
                    </p>
                    <p>
                      <strong>Pressure:</strong> {note.pressure}
                    </p>
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

  // Initialize chart.js with refs
  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      // Any initialization needed for the chart can go here
    }
  }, [selectedTest]);

  return (
    <div className="visualize">
      <header>
        <h1>Data Visualization</h1>
        <div className="header-actions">
          <button className="back-btn" onClick={goBack}>
            Back to Editor
          </button>
        </div>
      </header>

      <main>
        {!jsonData ? (
          <div className="no-data-message">
            <h2>No data found</h2>
            <p>Please validate your JSON in the editor first</p>
          </div>
        ) : jsonData ? (
          renderPatientCards()
        ) : (
          <p>Loading data...</p>
        )}
      </main>

      {showDetailModal && renderPatientDetails()}
      {showTestModal && renderTestDetails()}
    </div>
  );
}

export default Visualize;
