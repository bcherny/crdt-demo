import React, {
  useEffect,
  useState,
  ChangeEvent,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import './App.css'
import {is, OP, StartOP} from './ot'
import {transform} from './transform'
import {uid} from './util'
import {applyInsertToState, OTToState, applyDeleteToState} from './mapper'
import {Editor} from './Editor'
import {getDefaultKeyBinding} from 'draft-js'

let clientID = uid()
let initialBuffer = [StartOP]

console.log('🌈 clientID=', clientID)

export function App() {
  let liveBuffer = useRef<OP[]>(initialBuffer)
  let [buffer, setBuffer] = useState<OP[]>(initialBuffer)

  function flushBufferToUI() {
    setBuffer(liveBuffer.current)
  }

  let onMessage = useCallback((ot: OP) => {
    let indexInBuffer = liveBuffer.current.findIndex(_ => is(_, ot))

    // Hack: We don't need React to re-render here, since all that could have changed is
    // the server setting isCommitted=true. If we do update state here, we'll also run into
    // a race condition where if the client sent two updates A and B, the server processed
    // then, and onMessage was called with A, the useEffect block below would fire, re-sending
    // B, which we don't want. By updating in place and bypassing React state mgmt, we avoid
    // this.
    if (indexInBuffer > -1) {
      console.log('recieve (mine)', ot)
      liveBuffer.current[indexInBuffer] = ot
      return
    }

    let ot1 = transform(ot, liveBuffer.current, clientID)
    console.log('recieve (theirs)', ot, '->', ot1)
    liveBuffer.current = [...liveBuffer.current, ot1]
    flushBufferToUI()
  }, [])

  let send = useSocket(onMessage)

  // Derive text state from the buffer
  let state = useMemo(() => OTToState(buffer), [buffer])

  function onChange(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    selectedText: string,
    selection: [number, number]
  ) {
    console.log('selection', selection)
    // let {
    //   currentTarget: {selectionEnd, selectionStart, value: newState},
    // } = event
    // console.log('target', event, event.key, {
    //   selectionEnd,
    //   selectionStart,
    //   newState,
    // })
    // event.persist()
    // console.log(event.key)
    // Map state change to an operation
    let op =
      event.key === 'Backspace' || event.key === 'Del' || event.key === 'Delete'
        ? applyDeleteToState(
            state,
            selection[0],
            selection[1],
            clientID,
            liveBuffer.current
          )
        : event.key.length === 1
        ? applyInsertToState(
            event.key,
            selection[0],
            selection[1],
            clientID,
            liveBuffer.current
          )
        : null

    if (op === null) {
      return
    }

    // Update local buffer
    liveBuffer.current = [...liveBuffer.current, op]

    // Optimistically update UI
    flushBufferToUI()

    // Send buffer to server
    send?.(op)

    return getDefaultKeyBinding(event)
  }

  return (
    <div className="App">
      <Editor
        onKeyDown={onChange}
        placeholder="Type something..."
        value={state}
      />
    </div>
  )
}

function useSocket(onMessage: (ot: OP) => void) {
  let [send, setSend] = useState<null | ((ot: OP) => void)>(null)

  useEffect(() => {
    let socket = new WebSocket('ws://localhost:9000')
    console.log('Socket listening on 9000...')

    // Listen for messages
    socket.addEventListener('message', event => {
      onMessage(JSON.parse(event.data))
    })

    socket.addEventListener('open', () => {
      setSend(() => (ot: OP) => {
        console.log('send', ot)
        socket.send(JSON.stringify(ot))
      })
    })

    return () => socket.close()
  }, [onMessage])

  return send
}
