import React, {
  useEffect,
  useState,
  ChangeEvent,
  useCallback,
  useMemo,
} from 'react'
import './App.css'
import {is, LocalOT, MixedOT, isLocalOT, RemoteOT} from './ot'
import {transform} from './transform'
import {last, swap} from './util'
import {stateChangeToOT, OTToState} from './mapper'

export function App() {
  let [buffer, setBuffer] = useState<readonly MixedOT[]>([])

  let onMessage = useCallback((ot: RemoteOT) => {
    setBuffer(buffer => {
      // KILL ALL CYCLES!
      let otInBuffer = buffer.find(_ => is(_, ot))
      if (otInBuffer) {
        console.log('recieve (mine)', ot)
        return swap(buffer, otInBuffer, ot)
      }

      let ot1 = transform(ot, buffer)
      console.log('recieve (theirs)', ot, '->', ot1)
      return [...buffer, ot1]
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
    if (!isLocalOT(latestOT)) {
      return
    }
    send(latestOT)
  }, [buffer, send])

  function onChange({
    target: {selectionStart, value: newState},
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
