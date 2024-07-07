import { useState, useRef, useEffect } from 'react';
import * as Y from 'yjs';
import Editor from "@monaco-editor/react";
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import axios from 'axios';
import { io } from 'socket.io-client';
import debounce from 'lodash.debounce';

const LANGUAGE_VERSIONS = {
  java: '15.0.2', // Replace with the required Java version
};

const socket = io('http://localhost:3000');

function App() {
  const editorRef = useRef(null);
  const [output, setOutput] = useState('');
  const language = 'java'; // Set the language to Java

  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new WebrtcProvider("dsa-room", doc);
    const type = doc.getText("java-code");

    if (editorRef.current) {
      const binding = new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness);
    }

    socket.on('codeChange', (code) => {
      if (editorRef.current) {
        editorRef.current.setValue(code);
      }
    });

    socket.on('executionResult', (result) => {
      setOutput(result);
    });

    return () => {
      provider.destroy();
      doc.destroy();
      socket.off('codeChange');
      socket.off('executionResult');
    };
  }, []);

  const handleCodeChange = debounce(() => {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      socket.emit('codeChange', code);
    }
  }, 300);

  const runCode = () => {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      socket.emit('executeCode', code);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <Editor 
          height="100%"
          width="100%"
          theme="vs-dark"
          defaultLanguage="java"
          onMount={(editor) => editorRef.current = editor}
          onChange={handleCodeChange}
        />
      </div>
      <div className="w-1/3 p-4 bg-gray-900">
        <button 
          onClick={runCode} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 mb-4 w-full"
        >
          Run Code
        </button>
        <div className="mt-4">
          <h2 className="text-xl font-bold text-white">Output:</h2>
          <pre className="bg-gray-800 text-white p-4 rounded mt-2">{output}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
