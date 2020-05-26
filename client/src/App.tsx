import React, { useEffect, useState, ChangeEvent, useCallback, useMemo, useRef } from "react"
import "./App.css"

export function App() {
  let [buffer, setBuffer] = useState<OT[]>([])

  let addOperationToBuffer = useCallback((ot: OT) => {
    setBuffer(buffer => {
      // KILL ALL CYCLES!
      if (buffer.some(_ => is(_, ot))) {
        return buffer
      }
      return [...buffer, ot]
    })
  }, [])

  let onMessage = useCallback((ot: OT) => {
    addOperationToBuffer(ot)
  }, [addOperationToBuffer])

  let send = useSocket(onMessage)

  // Derive text state from the buffer
  let state = useMemo(() => OTToState(buffer), [buffer])

  // Send buffer to server when it changes
  // TODO: Fix bug where the buffer may have >1 new entry when this fires due to React batching
  useEffect(() => {
    let latestOT = last(buffer)
    if (!latestOT) {
      return
    }
    if (!send) {
      return
    }
    send(latestOT)
  }, [buffer, send])

  function onChange({
    target: { selectionStart, value: newState },
  }: ChangeEvent<HTMLTextAreaElement>) {
    let ot = stateChangeToOT(state, newState, selectionStart)
    addOperationToBuffer(ot)
  }

  return (
    <textarea
      className="textarea"
      onChange={onChange}
      placeholder="Type something..."
      value={state}
    />
  )
}

function last<T>(array: readonly T[]): T | undefined {
  return array[array.length - 1]
}

function is(a: OT, b: OT): a is typeof b {
  if (a.type === 'START_MARKER') {
    return b.type === 'START_MARKER'
  }
  if (a.type === 'END_MARKER') {
    return b.type === 'END_MARKER'
  }
  if (a.type === 'CHAR' && b.type === 'CHAR') {
    return a.id === b.id
  }
  return false
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

function uid() {
  function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  }
  return S4()+S4()+S4()
}

function stateChangeToOT(
  oldState: string,
  newState: string,
  cursorSelection: number
): OT {

  let id = uid()

  // Insert
  if (newState.length > oldState.length) {
    let index = cursorSelection - 1
    let newValue = newState[index]
    return {
      type: 'CHAR',
      id,
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
    id,
    index,
    value: oldValue,
    visible: false
  }
}

type OT =
  | {
      type: "CHAR"
      id: string
      index: number
      value: string
      visible: boolean
    }
  | { type: "START_MARKER" }
  | { type: "END_MARKER" }

function useSocket(onMessage: (ot: OT) => void) {

  let [send, setSend] = useState<null | ((ot: OT) => void)>(null)

  useEffect(() => {
    let socket = new WebSocket('ws://localhost:9000')
    console.log('Socket listening on 9000...')

    // Listen for messages
    socket.addEventListener('message', (event) => {
      onMessage(JSON.parse(event.data))
    })

    socket.addEventListener('open', () => {
      setSend(() => (ot: OT) => {
        console.log('send', ot)
        socket.send(JSON.stringify(ot))
      })
    })

    return () => socket.close()
  }, [onMessage])

  return send
}
