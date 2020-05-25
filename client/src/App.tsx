import React, { useEffect, useState, ChangeEvent, useCallback } from "react";
import "./App.css";

export function App() {
  let onMessage = useCallback((ot: OT) => {
    console.log('onMessage', ot)
  }, [])
  const socket = useSocket(onMessage);
  const [buffer, setBuffer] = useState<OT[]>([]);
  const [state, setState] = useState("");


  function onChange({
    target: { selectionStart, value: newState },
  }: ChangeEvent<HTMLTextAreaElement>) {
    let ot = stateToOT(state, newState, selectionStart);
    buffer.push(ot)
    console.log('ot', ot)
    setState(OTToState(buffer));
    setBuffer(buffer)
    socket.send(ot);
  }

  return (
    <textarea
      className="textarea"
      onChange={onChange}
      placeholder="Type something..."
      value={state}
    />
  );
}

function OTToState(ots: readonly OT[]): string {
  let initial: string[] = []
  ots.forEach(ot => {
    switch (ot.type) {
      case 'CHAR':
        if (ot.visible) {
          initial.splice(ot.index, 0, ot.value)
        } else {
          delete initial[ot.index]
        }
    }
  })
  return initial.join('')
}

function stateToOT(
  oldState: string,
  newState: string,
  cursorSelection: number
): OT {

  // Insert
  if (newState.length > oldState.length) {
    let index = cursorSelection - 1
    let newValue = newState[index]
    return {
      type: 'CHAR',
      index,
      value: newValue,
      visible: true
    }
  }

  // Delete
  let index = cursorSelection
  let oldValue = oldState[index]
  return {
    type: 'CHAR',
    index,
    value: oldValue,
    visible: false
  }
}

type OT =
  | {
      type: "CHAR";
      index: number;
      value: string;
      visible: boolean;
    }
  | { type: "START_MARKER" }
  | { type: "END_MARKER" };

function useSocket(onMessage: (ot: OT) => void) {

  let ret = {
    send(ot: OT) {}
  }

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:9000");

    console.log('Socket listening on 9000...')

    // Connection opened
    socket.addEventListener("open", () => {
      socket.send("Hello Server!");
    });

    // Listen for messages
    socket.addEventListener("message", (event) => {
      onMessage(event.data);
    });

    ret.send = (ot: OT) => {
      socket.send(JSON.stringify(ot))
    }

    return () => socket.close();
  }, [onMessage]);

  return ret
}
