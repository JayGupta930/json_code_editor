import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ value, onChange, height = '100%', options = {} }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      trailingCommas: false,
      schemaValidation: 'error',
    });
  };

  return (
    <Editor
      height={height}
      defaultLanguage="json"
      value={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        folding: true,
        automaticLayout: true,
        formatOnPaste: true,
        scrollBeyondLastLine: true,
        tabSize: 2,
        renderValidationDecorations: 'on',
        colorDecorators: true,
        padding: { top: 10, bottom: 20 },
        readOnly: options.readOnly || false,
        ...options,
      }}
    />
  );
};

export default CodeEditor;