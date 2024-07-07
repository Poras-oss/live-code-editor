import { useState, useRef, useEffect } from 'react';
import * as Y from 'yjs';
import Editor from "@monaco-editor/react";
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import axios from 'axios';
import { io } from 'socket.io-client';
import { throttle } from 'lodash';

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
      new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness);
    }

    socket.on('codeChange', (code) => {
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        const currentValue = model.getValue();
        const position = editorRef.current.getPosition();

        if (currentValue !== code) {
          model.applyEdits([{
            range: model.getFullModelRange(),
            text: code,
            forceMoveMarkers: true,
          }]);
          editorRef.current.setPosition(position);
        }
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

  const handleCodeChange = throttle(() => {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      socket.emit('codeChange', code);
    }
  }, 300); // Throttle to avoid too frequent updates

  const runCode = async () => {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      try {
        const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
          language: language,
          version: LANGUAGE_VERSIONS[language],
          files: [
            {
              content: code,
            },
          ],
        });
        setOutput(response.data.run.output);
      } catch (error) {
        setOutput('Error running code');
        console.error(error);
      }
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
          onMount={(editor) => {
            editorRef.current = editor;
            editor.onDidChangeModelContent(handleCodeChange);
          }}
        />
      </div>
      <div className="w-1/3 p-4 bg-gray-900">
        <button 
          onClick={runCode} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 mb-4 w-half"
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
