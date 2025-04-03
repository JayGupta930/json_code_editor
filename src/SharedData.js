import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getGistFileContent } from "./utils/githubConfig";

function SharedData() {
  const { dataId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGistData = async () => {
      try {
        const data = await getGistFileContent(dataId);
        // Navigate to visualize page with the fetched data
        navigate("/visualize", { state: { data } });
      } catch (err) {
        setError(
          "Failed to fetch shared data. Please check the URL and try again."
        );
        console.error("Error fetching gist:", err);
      }
    };

    if (dataId) {
      fetchGistData();
    }
  }, [dataId, navigate]);

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2e4edb",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Go to Editor
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Loading shared data...</h2>
    </div>
  );
}

export default SharedData;
