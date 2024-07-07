import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3000');

const CodeEditor = () => {
    const editorRef = useRef(null);
    const [editor, setEditor] = useState(null);
    const [output, setOutput] = useState('');

    useEffect(() => {
        if (editorRef.current) {
            const newEditor = monaco.editor.create(editorRef.current, {
                value: '',
                language: 'javascript',
                theme: 'vs-dark'
            });
            setEditor(newEditor);
            
            newEditor.onDidChangeModelContent(() => {
                const code = newEditor.getValue();
                socket.emit('codeChange', code);
            });
        }

        return () => {
            editor?.dispose();
        };
    }, []);

    useEffect(() => {
        socket.on('codeChange', (code) => {
            if (editor && editor.getValue() !== code) {
                editor.setValue(code);
            }
        });
    }, [editor]);

    const runCode = async () => {
        const code = editor.getValue();
        try {
            const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
                language: 'javascript',
                source: code,
            });
            setOutput(response.data.output);
        } catch (error) {
            setOutput('Error executing code');
        }
    };

    return (
        <div>
            <div ref={editorRef} style={{ height: '80vh', width: '100%' }}></div>
            <button onClick={runCode}>Run Code</button>
            <pre>{output}</pre>
        </div>
    );
};

export default CodeEditor;
