import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NextPage.css';

function NextPage() {
  const [jsonData, setJsonData] = useState(null);
  const [displayFormat, setDisplayFormat] = useState('cards'); // 'cards' or 'list'
  const [selectedItem, setSelectedItem] = useState(null); // Track selected item for details modal
  const [showDetailModal, setShowDetailModal] = useState(false); // Control modal visibility
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
      // Check if it's an array
      if (Array.isArray(data)) {
        // Handle arrays specially
        data.forEach((item, index) => {
          const currentKey = `${parentKey}[${index}]`; // Use bracket notation for array indices
          
          if (typeof item === 'object' && item !== null) {
            // Recursively process nested objects within arrays
            result = [...result, ...renderJsonAsList(item, currentKey)];
          } else {
            // Add array item to result
            result.push({ key: currentKey, value: item });
          }
        });
      } else {
        // Handle regular objects
        Object.entries(data).forEach(([key, value]) => {
          const currentKey = parentKey ? `${parentKey}.${key}` : key;
          
          if (typeof value === 'object' && value !== null) {
            // Recursively process nested objects or arrays
            result = [...result, ...renderJsonAsList(value, currentKey)];
          } else {
            // Add leaf node to the result
            result.push({ key: currentKey, value });
          }
        });
      }
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

  // Group data by top-level keys for better card organization
  const groupDataByTopLevel = (data) => {
    if (!data) return [];
    
    // If root is an array, create card groups by index
    if (Array.isArray(data)) {
      return data.map((item, index) => ({
        title: `Item ${index}`,
        key: `[${index}]`,
        data: item
      }));
    }
    
    // If root is an object, create card groups by top-level keys
    return Object.entries(data).map(([key, value]) => ({
      title: key,
      key: key,
      data: value
    }));
  };

  // Render a single card based on data
  const renderCard = (groupData) => {
    const { title, key, data } = groupData;
    
    // Handle different data types
    let cardContent;
    let cardTypeClass = 'card-object'; // Default card style for objects
    
    if (data === null) {
      cardContent = <span className="json-null">null</span>;
      cardTypeClass = 'card-null';
    } else if (typeof data !== 'object') {
      // Simple value card
      cardContent = (
        <div className="card-single-value">
          {formatValue(data)}
        </div>
      );
      cardTypeClass = `card-${typeof data}`;
    } else if (Array.isArray(data)) {
      // Array card
      cardContent = (
        <div className="card-list">
          {data.length > 0 ? (
            data.slice(0, 8).map((item, index) => (
              <div key={index} className="card-list-item">
                <span className="card-list-index">[{index}]</span>
                <span className="card-list-value">
                  {typeof item === 'object' && item !== null 
                    ? (Array.isArray(item) 
                        ? `Array[${item.length}]` 
                        : `Object{${Object.keys(item).length}}`)
                    : formatValue(item)}
                </span>
              </div>
            ))
          ) : (
            <span className="card-empty-array">[ ]</span>
          )}
          {data.length > 8 && (
            <div className="card-more-items">
              +{data.length - 8} more items...
            </div>
          )}
        </div>
      );
      cardTypeClass = 'card-array';
    } else {
      // Object card
      const entries = Object.entries(data);
      cardContent = (
        <div className="card-properties">
          {entries.length > 0 ? (
            entries.slice(0, 8).map(([propKey, propValue], index) => (
              <div key={propKey} className="card-property">
                <span className="card-property-key">{propKey}:</span>
                <span className="card-property-value">
                  {typeof propValue === 'object' && propValue !== null 
                    ? (Array.isArray(propValue) 
                        ? `Array[${propValue.length}]` 
                        : `Object{${Object.keys(propValue).length}}`)
                    : formatValue(propValue)}
                </span>
              </div>
            ))
          ) : (
            <span className="card-empty-object">{ }</span>
          )}
          {entries.length > 8 && (
            <div className="card-more-properties">
              +{entries.length - 8} more properties...
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className={`json-card ${cardTypeClass}`} key={key}>
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          <div className="card-type-badge">
            {Array.isArray(data) 
              ? `Array[${data.length}]` 
              : typeof data === 'object' && data !== null 
                ? `Object{${Object.keys(data).length}}` 
                : typeof data}
          </div>
        </div>
        <div className="card-content">
          {cardContent}
          

        </div>
        {(typeof data === 'object' && data !== null) && (
          <div className="card-footer">
            <button
              className="view-details-btn"
              onClick={() => {
                setSelectedItem({ title, data });
                setShowDetailModal(true);
              }}
            >
              View Details
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render detailed properties recursively
  const renderDetailedProperties = (data, path = '') => {
    if (data === null || data === undefined) {
      return <div className="detail-item"><span className="json-null">null</span></div>;
    }

    if (typeof data !== 'object') {
      return <div className="detail-item">{formatValue(data)}</div>;
    }

    if (Array.isArray(data)) {
      return (
        <div className="detail-array">
          {data.length === 0 ? (
            <span className="detail-empty-array">Empty Array</span>
          ) : (
            data.map((item, index) => (
              <div key={index} className="detail-array-item">
                <div className="detail-array-index">[{index}]</div>
                <div className="detail-array-value">{renderDetailedProperties(item, `${path}[${index}]`)}</div>
              </div>
            ))
          )}
        </div>
      );
    }

    // Object
    return (
      <div className="detail-object">
        {Object.entries(data).length === 0 ? (
          <span className="detail-empty-object">Empty Object</span>
        ) : (
          Object.entries(data).map(([key, value]) => (
            <div key={key} className="detail-property">
              <div className="detail-property-key">
                {key}
                {key === 'maritalStatus' }
              </div>
              <div className="detail-property-value">
                {renderDetailedProperties(value, path ? `${path}.${key}` : key)}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // Detail Modal Component
  const DetailModal = ({ item, onClose }) => {
    if (!item) return null;

    return (
      <div className="detail-modal-overlay" onClick={onClose}>
        <div className="detail-modal-content" onClick={e => e.stopPropagation()}>
          <div className="detail-modal-header">
            <h2 className="detail-modal-title">{item.title}</h2>
            <button className="detail-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="detail-modal-body">
            {renderDetailedProperties(item.data)}
          </div>
          <div className="detail-modal-footer">
            <button className="detail-modal-button" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  // Toggle between display formats
  const toggleDisplayFormat = () => {
    setDisplayFormat(displayFormat === 'cards' ? 'list' : 'cards');
  };

  return (
    <div className="next-page-container">
      <header>
        <h1>JSON Data Viewer</h1>
        <div className="header-controls">
          <button 
            className="display-toggle-btn"
            onClick={toggleDisplayFormat}
          >
            {displayFormat === 'cards' ? 'Show as List' : 'Show as Cards'}
          </button>
          <button onClick={goBack} className="back-btn">Back to Editor</button>
        </div>
      </header>
      <div className="json-content">
        {jsonData ? (
          <div className="json-viewer">
            <h2>Validated JSON Data:</h2>
            
            {displayFormat === 'cards' ? (
              <div className="cards-container">
                {groupDataByTopLevel(jsonData).map((group, index) => renderCard(group))}
              </div>
            ) : (
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
            )}
          </div>
        ) : (
          <div className="loading">Loading JSON data...</div>
        )}
      </div>
      
      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <DetailModal 
          item={selectedItem} 
          onClose={() => setShowDetailModal(false)} 
        />
      )}
    </div>
  );
}

export default NextPage;
