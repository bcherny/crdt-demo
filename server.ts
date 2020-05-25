import {Server} from 'ws'

const server = new Server({
  port: 9000
})

server.on('open', () => {
  console.log('server listening on 9000...')
});

server.on('connection', () => {
  console.log('new connection!')
})
