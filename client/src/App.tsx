import React, {
  useEffect,
  useState,
  ChangeEvent,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import './App.css'
import {is, LocalOT, MixedOT, isLocalOT, RemoteOT} from './ot'
import {transform} from './transform'
import {last} from './util'
import {stateChangeToOT, OTToState} from './mapper'

export function App() {
  let liveBuffer = useRef<MixedOT[]>([])
  let [buffer, setBuffer] = useState<MixedOT[]>([])

  function flushBufferToUI() {
    setBuffer(liveBuffer.current)
  }

  let onMessage = useCallback((ot: RemoteOT) => {
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

    let ot1 = transform(ot, liveBuffer.current)
    console.log('recieve (theirs)', ot, '->', ot1)
    liveBuffer.current = [...liveBuffer.current, ot1]
    flushBufferToUI()
  }, [])

  let send = useSocket(onMessage)

  // Derive text state from the buffer
  let state = useMemo(() => OTToState(buffer), [buffer])

  function onChange({
    target: {selectionStart, value: newState},
  }: ChangeEvent<HTMLTextAreaElement>) {
    // Map state change to OT
    let ot = stateChangeToOT(state, newState, selectionStart)

    // Update local buffer
    liveBuffer.current = [...buffer, ot]

    // Optimistically update UI
    flushBufferToUI()

    // Send buffer to server
    send?.(ot)
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

function useSocket(onMessage: (ot: RemoteOT) => void) {
  let [send, setSend] = useState<null | ((ot: LocalOT) => void)>(null)

  useEffect(() => {
    let socket = new WebSocket('ws://localhost:9000')
    console.log('Socket listening on 9000...')

    // Listen for messages
    socket.addEventListener('message', event => {
      onMessage(JSON.parse(event.data))
    })

    socket.addEventListener('open', () => {
      setSend(() => (ot: LocalOT) => {
        console.log('send', ot)
        socket.send(JSON.stringify(ot))
      })
    })

    return () => socket.close()
  }, [onMessage])

  return send
}
