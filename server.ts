import WebSocket from 'ws'

const server = new WebSocket.Server({
  port: 9000
})

let activeSockets = new Set<WebSocket>()

server.on('open', () => {
  console.log('server listening on 9000...')
});

server.on('connection', socket => {
  activeSockets.add(socket)
  console.log('new connection! # active sockets=', activeSockets.size)

  socket.on('message', message => {
    console.log('received: %s', message);
    activeSockets.forEach(socket => socket.send(message))
  })

  socket.on('close', () => {
    activeSockets.delete(socket)
  })
})
