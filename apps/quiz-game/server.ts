import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import { initSocketServer } from './src/multiplayer/socketServer';

const port = parseInt(process.env.PORT ?? '3000', 10);
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: false },
  });

  initSocketServer(io);

  httpServer.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🎮 حلبة الأسئلة تعمل على http://localhost:${port} (${dev ? 'تطوير' : 'إنتاج'})`);
  });
});
