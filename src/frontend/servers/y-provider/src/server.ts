import { Server } from '@hocuspocus/server';

const port = Number(process.env.PORT || 4444);

const server = Server.configure({
  name: 'docs-y-provider',
  port: port,
  timeout: 30000,
  debounce: 2000,
  maxDebounce: 30000,
  quiet: true,
});

server.listen().catch((error) => {
  console.error('Failed to start the server:', error);
});

console.log('Websocket server running on port :', port);
