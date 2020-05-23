import React, { useEffect, useState, ChangeEvent } from 'react';
import './App.css';

export function App() {
  useSocket(onMessage, send);
  const [buffer, setBuffer] = useState<OT[]>([])
  const [state, setState] = useState('')

  function onMessage(ot: OT) {}
  function send(ot: OT) {}

  function onChange({target: {value: newState}}: ChangeEvent<HTMLTextAreaElement>) {
    const ot = stateToOT(state, newState)
    setState(newState)
    send(ot)
  }

  return <textarea className='textarea' onChange={onChange} value={state} />;
}

function stateToOT(oldState: string, newState: string): OT {
  // TODO
}

type OT = {}

function useSocket(onMessage: (ot: OT) => void, send: (ot: OT) => void) {
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    // Connection opened
    socket.addEventListener('open', () => {
      socket.send('Hello Server!');
    });

    // Listen for messages
    socket.addEventListener('message', (event) => {
      onMessage(event.data);
    });

    return () => socket.close();
  }, []);
}
