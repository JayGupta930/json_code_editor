import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NextPage.css';

function NextPage() {
  const [jsonData, setJsonData] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    try {
      // Retrieve the complete JSON data from localStorage
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

  // Convert JSON data to a flat list of key-value pairs
  const renderJsonAsList = (data, parentKey = '') => {
    if (!data) return [];
    
    let result = [];
    
    if (typeof data === 'object' && data !== null) {
      // Handle objects and arrays
      Object.entries(data).forEach(([key, value]) => {
        const currentKey = parentKey ? `${parentKey}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          // Recursively process nested objects
          result = [...result, ...renderJsonAsList(value, currentKey)];
        } else {
          // Add leaf node to the result
          result.push({ key: currentKey, value });
        }
      });
    } else {
      // Handle primitive values (unlikely at root level, but just in case)
      result.push({ key: parentKey || 'value', value: data });
    }
    
    return result;
  };

  // Format value based on its type
  const formatValue = (value) => {
    if (value === null) return <span className="json-null">null</span>;
    if (value === undefined) return <span className="json-null">undefined</span>;
    
    switch (typeof value) {
      case 'string':
        return <span className="json-string">"{value}"</span>;
      case 'number':
        return <span className="json-number">{value}</span>;
      case 'boolean':
        return <span className="json-boolean">{String(value)}</span>;
      default:
        return String(value);
    }
  };

  return (
    <div className="next-page-container">
      <header>
        <h1>JSON Data Viewer</h1>
        <button onClick={goBack} className="back-btn">Back to Editor</button>
      </header>
      <div className="json-content">
        {jsonData ? (
          <div className="json-viewer">
            <h2>Validated JSON Data:</h2>
            <div className="json-list-container">
              <table className="json-list-table">
                <thead>
                  <tr>
                    <th>Property Path</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {renderJsonAsList(jsonData).map((item, index) => (
                    <tr key={index} className="json-list-item">
                      <td className="json-list-key">{item.key}</td>
                      <td className="json-list-value">{formatValue(item.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="loading">Loading JSON data...</div>
        )}
      </div>
    </div>
  );
}

export default NextPage;
