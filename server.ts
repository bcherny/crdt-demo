import WebSocket from 'ws'
import {LocalOP, RemoteOP} from './client/src/ot'

const server = new WebSocket.Server({
  port: 9000,
})

let activeSockets = new Set<WebSocket>()

server.on('open', () => {
  console.log('server listening on 9000...')
})

server.on('connection', socket => {
  activeSockets.add(socket)
  console.log('new connection! # active sockets=', activeSockets.size)

  socket.on('message', message => {
    console.log('received: %s', message)
    let ot: LocalOP = JSON.parse(message.toString())
    let committedOT: RemoteOP =
      ot.type === 'CHAR' ? {...ot, isCommitted: true} : ot
    // TODO: Write to DB
    let stringifiedCommittedOT = JSON.stringify(committedOT, null, 2)
    setTimeout(() => {
      activeSockets.forEach(socket => socket.send(stringifiedCommittedOT))
    }, 4000)
  })

  socket.on('close', () => {
    activeSockets.delete(socket)
  })
})
