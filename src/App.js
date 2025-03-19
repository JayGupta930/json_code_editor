import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useDropzone } from 'react-dropzone';
import Ajv from 'ajv';
import { useNavigate } from 'react-router-dom';
import './App.css';

function App() {
  const [code, setCode] = useState('{\n  "example": "This is a JSON editor"\n}');
  const [isValid, setIsValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState([]);
  const [schema, setSchema] = useState(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const navigate = useNavigate(); // Add navigate hook

  // Initialize AJV validator
  const ajv = new Ajv({ allErrors: true });

  useEffect(() => {
    // Check if we have previously validated JSON in localStorage
    const savedJSON = localStorage.getItem('validatedJSON');
    if (savedJSON) {
      try {
        // Format the saved JSON for better display
        const formattedJSON = JSON.stringify(JSON.parse(savedJSON), null, 2);
        setCode(formattedJSON);
      } catch (e) {
        console.error("Error loading saved JSON:", e);
      }
    }

    // Example: Load a schema from a file or API
    // For demonstration, we'll use a simple schema
    const demoSchema = {
      type: "object",
      properties: {
        example: { type: "string" },
        name: { type: "string" },
        age: { type: "number" }
      },
      // Remove any "required" constraints that might filter data
      additionalProperties: true // Allow additional properties beyond the schema
    };
    setSchema(demoSchema);
  }, []);

  // Handle editor mounting with enhanced configuration
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Configure Monaco Editor for better JSON experience
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      trailingCommas: false,
      schemaValidation: 'error'
    });
    
    // Set up real-time JSON validation
    editor.onDidChangeModelContent(() => {
      validateJsonContent(editor.getValue());
    });
  };

  // Validate JSON content using both native parse and AJV schema validation
  const validateJsonContent = (jsonContent) => {
    try {
      // Basic syntax validation
      const parsedJson = JSON.parse(jsonContent);
      
      // Schema validation if schema is available
      if (schema) {
        const validate = ajv.compile(schema);
        const valid = validate(parsedJson);
        
        if (!valid) {
          // Enhanced schema validation errors
          const enhancedErrors = validate.errors.map(error => {
            // For schema errors, extract the path to help locate the issue
            const path = error.instancePath || '';
            return {
              message: `${error.message} at '${path || 'root'}'`,
              path: path,
              keyword: error.keyword,
              params: error.params
            };
          });
          
          setValidationErrors(enhancedErrors);
          setIsValid(false);
          return;
        }
      }
      
      setValidationErrors([]);
      setIsValid(true);
    } catch (e) {
      // For syntax errors, try to extract line information
      const errorMessage = e.message;
      let lineNumber = null;
      
      const positionMatch = errorMessage.match(/at position (\d+)/);
      if (positionMatch && positionMatch[1]) {
        const position = parseInt(positionMatch[1], 10);
        const contentBeforeError = jsonContent.substring(0, position);
        lineNumber = (contentBeforeError.match(/\n/g) || []).length + 1;
      }
      
      setValidationErrors([{ 
        message: errorMessage,
        lineNumber: lineNumber,
        fullError: `Error on line ${lineNumber || 'unknown'}: ${errorMessage}`
      }]);
      setIsValid(false);
    }
  };

  // Format JSON with enhanced error reporting
  const formatJSON = () => {
    if (!editorRef.current) return;
    
    try {
      const value = editorRef.current.getValue();
      const formatted = JSON.stringify(JSON.parse(value), null, 2);
      editorRef.current.setValue(formatted);
      validateJsonContent(formatted);
    } catch (e) {
      setIsValid(false);
      
      // Enhanced error handling with line number detection
      const errorMessage = e.message;
      let lineNumber = null;
      
      // Extract line number information from the error message if available
      const positionMatch = errorMessage.match(/at position (\d+)/);
      if (positionMatch && positionMatch[1]) {
        const position = parseInt(positionMatch[1], 10);
        // Calculate the line number by counting newlines before the position
        const value = editorRef.current.getValue(); // Define value variable here
        const contentBeforeError = value.substring(0, position);
        lineNumber = (contentBeforeError.match(/\n/g) || []).length + 1;
      }
      
      // Create a more detailed error message with line info if available
      const detailedError = {
        message: errorMessage,
        lineNumber: lineNumber,
        position: positionMatch ? positionMatch[1] : null,
        rawError: e.toString()
      };
      
      setValidationErrors([detailedError]);
      
      // Additionally, if we have Monaco editor reference, we can highlight the error
      if (lineNumber && editorRef.current && monacoRef.current) {
        const monaco = monacoRef.current;
        const editor = editorRef.current;
        
        // Focus editor and position cursor at the error location
        editor.focus();
        editor.revealLineInCenter(lineNumber);
        editor.setPosition({ lineNumber, column: 1 });
      }
    }
  };

  // File upload handler with enhanced validation
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          // Validate JSON
          JSON.parse(content); // Just check if it's valid JSON
          setCode(content);
          validateJsonContent(content);
        } catch (e) {
          alert('Invalid JSON file!');
        }
      };
      reader.readAsText(file);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  // Enhanced validation with proper error display and navigation
  const validateJSON = () => {
    if (!editorRef.current) return;
    
    try {
      const value = editorRef.current.getValue();
      validateJsonContent(value);
      
      if (isValid) {
        // Store the complete JSON data
        try {
          const parsedJSON = JSON.parse(value);
          // Store the validated JSON in localStorage (complete data)
          localStorage.setItem('validatedJSON', JSON.stringify(parsedJSON));
          localStorage.setItem('editorJSON', value); // Store the formatted editor content
          
          alert("JSON is valid! Navigating to next page...");
          // Navigate to the next page
          navigate('/next-page');
        } catch (e) {
          setIsValid(false);
          alert(`JSON parsing error: ${e.message}`);
        }
      } else {
        alert(`JSON validation failed: ${validationErrors.map(err => err.message).join(', ')}`);
      }
    } catch (e) {
      setIsValid(false);
      alert(`JSON validation error: ${e.message}`);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>JSON Code Editor</h1>
        <div className="controls">
          <button onClick={formatJSON} className="btn">Format JSON</button>
          <div {...getRootProps({ className: 'dropzone' })}>
            <input {...getInputProps()} />
            <button className="btn">Upload JSON</button>
          </div>
          {!isValid && <span className="error-message">Invalid JSON</span>}
        </div>
      </header>
      <div className="editor-container">
        <Editor
          height="90vh"
          defaultLanguage="json"
          value={code}
          onChange={setCode}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            folding: true,
            automaticLayout: true,
            formatOnPaste: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            renderValidationDecorations: 'on',
            colorDecorators: true
          }}
        />
      </div>
      <div className="validation-container">
        <button onClick={validateJSON} className="validate-btn">
          Validate JSON
        </button>
      </div>
      {validationErrors.length > 0 && (
        <div className="errors-panel">
          <h3>Validation Errors:</h3>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index} className="error-item">
                {error.lineNumber ? (
                  <span className="error-location">Line {error.lineNumber}: </span>
                ) : error.path ? (
                  <span className="error-location">Path '{error.path}': </span>
                ) : null}
                <span className="error-message">{error.message}</span>
                {error.rawError && (
                  <details>
                    <summary>Details</summary>
                    <pre className="error-details">{error.rawError}</pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
