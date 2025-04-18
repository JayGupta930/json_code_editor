import React, { useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { createChartOptions, calculateStats, createGradient, hexToRgba } from './utils/chartConfig';
import './PatientCard.css';

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

const TestDetailsModal = ({ 
  test, 
  onClose, 
  chartType, 
  setChartType, 
  statsHighlight, 
  setStatsHighlight,
  compareMode,
  compareWith,
  setCompareMode,
  setCompareWith,
  comparisonOptions
}) => {
  const chartRef = useRef(null);

  if (!test) return null;

  const stats = calculateStats(test.dataPoints);
  const labels = Array.from({ length: test.dataPoints.length }, (_, i) => i + 1);
  const annotations = {};
  const pointRadiusArray = new Array(test.dataPoints.length).fill(0);

  if (statsHighlight === "anomalies" && stats.anomalies) {
    stats.anomalies.forEach((index) => {
      pointRadiusArray[index] = 5;
      annotations["anomaly" + index] = {
        type: "point",
        xValue: index,
        yValue: test.dataPoints[index],
        backgroundColor: "rgba(255, 99, 132, 0.7)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
        radius: 6,
      };
    });
  }

  if (test.notes && test.notes.length > 0) {
    test.notes.forEach((note, index) => {
      if (note.timestamp >= 0 && note.timestamp < pointRadiusArray.length) {
        pointRadiusArray[note.timestamp] = 6;
      }

      annotations["point" + index] = {
        type: "point",
        xValue: note.timestamp,
        yValue: note.pressure,
        backgroundColor: hexToRgba(note.color, 0.7),
        borderColor: hexToRgba(note.color),
        borderWidth: 2,
        radius: 6,
      };

      annotations["label" + index] = {
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
        font: { size: 12 },
        padding: 6,
      };

      annotations["line" + index] = {
        type: "line",
        xMin: note.timestamp,
        xMax: note.timestamp,
        borderColor: hexToRgba(note.color, 0.5),
        borderWidth: 1,
        borderDash: [5, 5],
        label: { display: false },
      };
    });
  }

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

  annotations.targetLine = {
    type: "line",
    yMin: test.targetPressure || Math.max(...test.dataPoints) * 0.75,
    yMax: test.targetPressure || Math.max(...test.dataPoints) * 0.75,
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

  if (test.normalRangeLow && test.normalRangeHigh) {
    annotations.normalRange = {
      type: "box",
      yMin: test.normalRangeLow,
      yMax: test.normalRangeHigh,
      backgroundColor: "rgba(144, 238, 144, 0.2)",
      borderColor: "rgba(144, 238, 144, 0.8)",
      borderWidth: 1,
      label: {
        display: true,
        content: "Normal Range",
        position: "start",
        backgroundColor: "rgba(144, 238, 144, 0.8)",
        color: "#000",
        font: { size: 11 },
      },
    };
  }

  const datasets = [
    {
      label: "Pressure",
      data: test.dataPoints,
      borderColor: function (context) {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return "rgba(75, 192, 192, 1)";
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
        if (!chartArea) return "rgba(75, 192, 192, 0.4)";
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
      tension: chartType === "smooth" ? 0.4 : chartType === "stepped" ? 0 : 0.1,
      fill: true,
      borderWidth: 2,
      stepped: chartType === "stepped",
    },
  ];

  if (compareMode && compareWith && compareWith.dataPoints) {
    datasets.push({
      label: "Comparison",
      data: compareWith.dataPoints,
      borderColor: "rgba(255, 99, 132, 1)",
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      pointRadius: 0,
      pointHoverRadius: 6,
      tension: chartType === "smooth" ? 0.4 : chartType === "stepped" ? 0 : 0.1,
      fill: false,
      borderWidth: 2,
      borderDash: [5, 5],
      stepped: chartType === "stepped",
    });

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

  const chartOptions = createChartOptions({
    pointRadiusArray,
    formatDate: formatDate(test.createdAt),
    annotations,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content test-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Test Details</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <p><strong>Date:</strong> {formatDate(test.createdAt)}</p>

        <div className="clinical-notes">
          <p>
            <strong>Pre-Clinical Notes:</strong>{" "}
            {test.preClinicalNotes || "None"}
          </p>
          <p>
            <strong>Post-Clinical Notes:</strong>{" "}
            {test.postClinicalNotes || "None"}
          </p>
          <p>
            <strong>Leakage Volume:</strong> {test.leakageVolume || 0}
          </p>
          <p>
            <strong>Bladder Capacity:</strong>{" "}
            {test.bladderCapacity || "N/A"}
          </p>
          <p>
            <strong>Post Void Residue:</strong>{" "}
            {test.postVoidResidue || 0}
          </p>
        </div>

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

        <div className="chart-container">
          <Line data={chartData} options={chartOptions} height={400} ref={chartRef} />
        </div>

        <div className="notes-section">
          <h3>Test Notes</h3>
          {test.notes && test.notes.length > 0 ? (
            <div className="notes-list">
              {test.notes.map((note, index) => (
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

export default TestDetailsModal;