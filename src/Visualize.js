import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Visualize.css";
import "./Card.css";
import PatientCard from "./PatientCard";
import PatientDetailsModal from "./PatientDetailsModal";
import TestDetailsModal from "./TestDetailsModal";

function Visualize() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin] = useState(() => location.state?.fromAdmin === true);
  const [jsonData] = useState(location.state?.data || null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [chartType, setChartType] = useState("smooth");
  const [compareMode, setCompareMode] = useState(false);
  const [compareWith, setCompareWith] = useState(null);
  const [statsHighlight, setStatsHighlight] = useState("none");

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
    setCompareWith(null);
    setShowTestModal(true);
  };

  const closeTestDetails = () => {
    setShowTestModal(false);
  };

  const renderPatientCards = () => {
    if (!jsonData || !jsonData.length) {
      return <p>No patient data available</p>;
    }

    return (
      <div className="patient-cards">
        {jsonData.map((patient) => (
          <PatientCard
            key={patient.patientId}
            patient={patient}
            isAdmin={isAdmin}
            onViewDetails={viewPatientDetails}
          />
        ))}
      </div>
    );
  };

  const getComparisonOptions = () => {
    const options = [];
    if (selectedItem && selectedItem.cmgTests) {
      selectedItem.cmgTests.forEach((test, index) => {
        if (test !== selectedTest) {
          options.push({
            id: index,
            date: new Date(test.createdAt).toLocaleString(),
            test: test,
          });
        }
      });
    }
    return options;
  };

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

      {showDetailModal && (
        <PatientDetailsModal
          patient={selectedItem}
          onClose={closePatientDetails}
          onViewTest={viewTestDetails}
        />
      )}
      
      {showTestModal && (
        <TestDetailsModal
          test={selectedTest}
          onClose={closeTestDetails}
          chartType={chartType}
          setChartType={setChartType}
          statsHighlight={statsHighlight}
          setStatsHighlight={setStatsHighlight}
          compareMode={compareMode}
          compareWith={compareWith}
          setCompareMode={setCompareMode}
          setCompareWith={setCompareWith}
          comparisonOptions={getComparisonOptions()}
        />
      )}
    </div>
  );
}

export default Visualize;
