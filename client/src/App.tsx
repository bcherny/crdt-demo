import React, { useEffect, useState, ChangeEvent, useCallback, useMemo, useRef } from "react"
import "./App.css"
import { OT, is, OTToState } from "./ot"
import { transform } from "./transform"
import { last, uid } from "./util"

export function App() {
  let [buffer, setBuffer] = useState<OT[]>([])

  let onMessage = useCallback((ot: OT) => {
    setBuffer(buffer => {
      // KILL ALL CYCLES!
      if (buffer.some(_ => is(_, ot))) {
        return buffer
      }
      return [...buffer, transform(ot, buffer)]
    })
  }, [])

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
    setBuffer(buffer => [...buffer, ot])
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
