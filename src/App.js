import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useDropzone } from "react-dropzone";
import Ajv from "ajv";
import { useNavigate } from "react-router-dom";
import "./App.css";

function App() {
  const [code, setCode] = useState(
    '{\n  "example": "This is a JSON editor"\n}'
  );
  const [isValid, setIsValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState([]);
  const [schema, setSchema] = useState(null);
  const [showUploadAlert, setShowUploadAlert] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const navigate = useNavigate();

  // Initialize AJV validator
  const ajv = new Ajv({ allErrors: true });

  useEffect(() => {
    // Check if we have previously validated JSON in localStorage
    const savedJSON = localStorage.getItem("validatedJSON");
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
    // For demonstration, we'll use a more flexible schema that accepts both objects and arrays
    const demoSchema = {
      // Use oneOf to allow multiple types at the root
      oneOf: [
        // Option 1: An object
        {
          type: "object",
          properties: {
            example: { type: "string" },
            name: { type: "string" },
            age: { type: "number" },
          },
          additionalProperties: true, // Allow additional properties
        },
        // Option 2: An array
        {
          type: "array",
          items: {
            // Each array item can be any valid JSON value
            oneOf: [
              { type: "object", additionalProperties: true },
              { type: "array", items: {} },
              { type: "string" },
              { type: "number" },
              { type: "boolean" },
              { type: "null" },
            ],
          },
        },
      ],
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
      schemaValidation: "error",
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
          // Enhanced schema validation errors with better messages for arrays
          const enhancedErrors = validate.errors.map((error) => {
            // For schema errors, extract the path to help locate the issue
            const path = error.instancePath || "";
            const isRootArray =
              parsedJson && Array.isArray(parsedJson) && path === "";

            // Customize message for root array if needed
            let customMessage = error.message;
            if (isRootArray && error.message.includes("must be object")) {
              customMessage = "JSON structure is valid (array format accepted)";
            }

            return {
              message: `${customMessage} at '${path || "root"}'`,
              path: path,
              keyword: error.keyword,
              params: error.params,
            };
          });

          if (
            Array.isArray(parsedJson) &&
            enhancedErrors.length === 1 &&
            enhancedErrors[0].keyword === "type" &&
            enhancedErrors[0].path === ""
          ) {
            setValidationErrors([]);
            setIsValid(true);
            return;
          }

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

      setValidationErrors([
        {
          message: errorMessage,
          lineNumber: lineNumber,
          fullError: `Error on line ${
            lineNumber || "unknown"
          }: ${errorMessage}`,
        },
      ]);
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

      // Enhanced error handling with more precise line number detection
      const errorMessage = e.message;
      let lineNumber = null;
      let columnNumber = null;

      // First, try to extract position from the JSON syntax error
      const positionMatch = errorMessage.match(/at position (\d+)/);
      if (positionMatch && positionMatch[1]) {
        const position = parseInt(positionMatch[1], 10);
        const value = editorRef.current.getValue();

        // Find line and column number by analyzing the text
        let line = 1;
        let column = 1;
        for (let i = 0; i < position; i++) {
          if (value[i] === "\n") {
            line++;
            column = 1;
          } else {
            column++;
          }
        }

        lineNumber = line;
        columnNumber = column;
      }

      // Create a detailed error message with precise location
      const detailedError = {
        message: errorMessage,
        lineNumber: lineNumber,
        columnNumber: columnNumber,
        position: positionMatch ? positionMatch[1] : null,
        rawError: e.toString(),
        // Store the actual content of the problematic line for display
        lineContent: lineNumber
          ? getLineContent(editorRef.current.getValue(), lineNumber)
          : null,
      };

      setValidationErrors([detailedError]);

      // Highlight the error in the editor
      if (lineNumber && editorRef.current && monacoRef.current) {
        const monaco = monacoRef.current;
        const editor = editorRef.current;

        // Focus editor and position cursor at the error location
        editor.focus();
        editor.revealLineInCenter(lineNumber);

        // Set cursor to the exact position of the error
        if (columnNumber) {
          editor.setPosition({ lineNumber, column: columnNumber });

          // Add a decoration to highlight the error
          const decorations = editor.deltaDecorations(
            [],
            [
              {
                range: new monaco.Range(
                  lineNumber,
                  columnNumber,
                  lineNumber,
                  columnNumber + 1
                ),
                options: {
                  inlineClassName: "errorHighlight",
                  hoverMessage: { value: errorMessage },
                },
              },
            ]
          );

          // Remove decoration after 5 seconds
          setTimeout(() => {
            editor.deltaDecorations(decorations, []);
          }, 5000);
        } else {
          editor.setPosition({ lineNumber, column: 1 });
        }
      }
    }
  };

  // Helper function to get the content of a specific line
  const getLineContent = (text, lineNumber) => {
    const lines = text.split("\n");
    return lines[lineNumber - 1] || "";
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
          const parsedData = JSON.parse(content);
          setCode(content);
          validateJsonContent(content);
          setShowUploadAlert(false); // Close the alert on success

          // Store in localStorage (maintaining backward compatibility)
          localStorage.setItem("validatedJSON", JSON.stringify(parsedData));
          localStorage.setItem("editorJSON", content); // Store the formatted editor content

          // Also store in sessionStorage for sharing functionality
          sessionStorage.setItem("uploadedJSON", content);
          
        } catch (e) {
          alert("Invalid JSON file!");
        }
      };
      reader.readAsText(file);
    }
  };

  // Dropzone for the main component
  const { getRootProps: getMainRootProps, getInputProps: getMainInputProps } =
    useDropzone({
      onDrop,
      accept: {
        "application/json": [".json"],
      },
      maxFiles: 1,
      noClick: showUploadAlert, // Disable clicks when alert is showing
    });

  // Separate dropzone for the alert dialog
  const { getRootProps: getAlertRootProps, getInputProps: getAlertInputProps } =
    useDropzone({
      onDrop,
      accept: {
        "application/json": [".json"],
      },
      maxFiles: 1,
    });

  // Enhanced validation with proper error display and navigation
  const validateJSON = () => {
    if (!editorRef.current) return;

    try {
      const value = editorRef.current.getValue();
      validateJsonContent(value);

      if (isValid) {
        try {
          const parsedJSON = JSON.parse(value);
          // Remove storage operations and directly pass data through navigation
          navigate("/visualize", { state: { data: parsedJSON } });
        } catch (e) {
          setIsValid(false);
          alert(`JSON parsing error: ${e.message}`);
        }
      } else {
        alert(
          `JSON validation failed: ${validationErrors
            .map((err) => err.message)
            .join(", ")}`
        );
      }
    } catch (e) {
      setIsValid(false);
      alert(`JSON validation error: ${e.message}`);
    }
  };

  return (
    <div className="app-container">
      <header>
        <div className="title-container">
          <h1>
            JSON Code Editor <span className="version">v1.0.0</span>
          </h1>
        </div>
        <div className="controls">
          <button onClick={formatJSON} className="btn">
            Format JSON
          </button>
          <div {...getMainRootProps({ className: "dropzone" })}>
            <input {...getMainInputProps()} />
            <button
              className="btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowUploadAlert(true);
              }}
            >
              Upload JSON
            </button>
          </div>
        </div>
      </header>
      <div className="editor-container">
        <Editor
          height="calc(90vh - 70px)" /* Adjusted height to account for bottom padding */
          defaultLanguage="json"
          value={code}
          onChange={setCode}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: "on",
            folding: true,
            automaticLayout: true,
            formatOnPaste: true,
            scrollBeyondLastLine: true /* Changed to true to allow scrolling beyond last line */,
            tabSize: 2,
            renderValidationDecorations: "on",
            colorDecorators: true,
            padding: { top: 10, bottom: 20 } /* Added padding to the editor */,
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
                  <div className="error-location-container">
                    <span className="error-location">
                      Line {error.lineNumber}
                    </span>
                    {error.columnNumber && (
                      <span className="error-column">
                        , Column {error.columnNumber}
                      </span>
                    )}
                    :
                    {error.lineContent && (
                      <pre className="error-line-content">
                        {error.lineContent}
                        {error.columnNumber && (
                          <div
                            className="error-pointer"
                            style={{ paddingLeft: error.columnNumber - 1 }}
                          >
                            ^
                          </div>
                        )}
                      </pre>
                    )}
                  </div>
                ) : error.path ? (
                  <span className="error-location">Path '{error.path}'</span>
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

      {/* Beautiful Upload JSON Alert */}
      <div
        className={`alert-overlay ${showUploadAlert ? "show" : ""}`}
        onClick={() => setShowUploadAlert(false)}
      >
        <div className="alert-card" onClick={(e) => e.stopPropagation()}>
          <div className="alert-header">
            <div className="alert-icon">📁</div>
            <h3 className="alert-title">Upload JSON File</h3>
          </div>
          <div className="alert-message">
            Select or drag and drop a JSON file to import into the editor. Your
            current data will be replaced with the loaded file content.
          </div>

          <div {...getAlertRootProps({ className: "alert-dropzone" })}>
            <input {...getAlertInputProps()} />
            <div className="alert-dropzone-icon">⬆️</div>
            <div className="alert-dropzone-text">
              Drag & drop your JSON file here, or click to select
            </div>
          </div>

          <div className="alert-actions">
            <button
              className="alert-button alert-button-cancel"
              onClick={() => setShowUploadAlert(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
