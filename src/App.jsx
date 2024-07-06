import { useState, useRef } from 'react';
import * as Y from 'yjs';
import Editor from "@monaco-editor/react";
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import axios from 'axios';


const LANGUAGE_VERSIONS = {
  java: '15.0.2', // Replace with the required Java version
};


function App() {
  const editorRef = useRef(null);
  const [output, setOutput] = useState('');

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;

    const doc = new Y.Doc();
    const provider = new WebrtcProvider("dsa-room", doc);
    const type = doc.getText("java-code");
    new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness);
  }

  async function runCode() {
    const code = editorRef.current.getValue();

    try {
      const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
        language: "java",
        version: LANGUAGE_VERSIONS["java"],
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

  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <Editor 
          height="100%"
          width="100%"
          theme="vs-dark"
          defaultLanguage="java"
          onMount={handleEditorDidMount}
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
