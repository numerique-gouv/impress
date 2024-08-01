/**
 * Based on https://github.com/yjs/y-webrtc/blob/master/bin/server.js
 */
import http from 'http';

import * as map from 'lib0/map';
import WebSocket, { WebSocketServer } from 'ws';

type MessageYJSType = {
  type: string;
  topics?: string[];
  topic?: string;
  clients?: number;
};

type MessageYJSTypes = MessageYJSType | string;

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const pingTimeout = 30000;
const port = process.env.PORT || 4444;

const wss = new WebSocketServer({ noServer: true });
const topics = new Map<string, Set<{ url: string; conn: WebSocket }>>();

const send = (conn: WebSocket, message: MessageYJSTypes) => {
  if (
    conn.readyState !== wsReadyStateConnecting &&
    conn.readyState !== wsReadyStateOpen
  ) {
    conn.close();
  }
  try {
    conn.send(JSON.stringify(message));
  } catch (e) {
    conn.close();
  }
};

/**
 * Setup a new client
 */
const onconnection = (conn: WebSocket, url: string) => {
  const subscribedTopics = new Set<string>();
  let closed = false;
  // Check if connection is still alive
  let pongReceived = true;

  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      conn.close();
      clearInterval(pingInterval);
    } else {
      pongReceived = false;
      try {
        conn.ping();
      } catch (e) {
        conn.close();
      }
    }
  }, pingTimeout);

  conn.on('pong', () => {
    pongReceived = true;
  });

  conn.on('close', () => {
    subscribedTopics.forEach((topicName) => {
      const subs = topics.get(topicName) || new Set();
      subs.forEach((sub) => {
        if (sub.url === url && sub.conn === conn) {
          subs.delete(sub);
        }
      });
      if (subs.size === 0) {
        topics.delete(topicName);
      }
    });
    subscribedTopics.clear();
    closed = true;
  });

  conn.on('message', (message: MessageYJSTypes) => {
    if (typeof message === 'string' || message instanceof Buffer) {
      message = JSON.parse(message.toString()) as MessageYJSType;
    }

    if (message && message.type && !closed) {
      switch (message.type) {
        case 'subscribe':
          (message.topics || []).forEach((topicName) => {
            if (typeof topicName === 'string') {
              // add conn to topic
              const topic = map.setIfUndefined(
                topics,
                topicName,
                () => new Set(),
              );

              let isAlreadyAdded = false;
              topic.forEach((sub) => {
                if (sub.url === url && sub.conn === conn) {
                  isAlreadyAdded = true;
                }
              });

              if (!isAlreadyAdded) {
                topic.add({ url, conn });
                subscribedTopics.add(topicName);
              }
            }
          });
          break;

        case 'unsubscribe':
          (message.topics || []).forEach((topicName) => {
            const subs = topics.get(topicName);
            if (subs) {
              subs.forEach((sub) => {
                if (sub.conn === conn) {
                  subs.delete(sub);
                }
              });
            }
          });
          break;

        case 'publish':
          if (message.topic) {
            const receivers = topics.get(message.topic);
            if (receivers) {
              message.clients = receivers.size;
              receivers.forEach(({ url: receiverUrl, conn: receiverConn }) => {
                if (receiverUrl === url) {
                  send(receiverConn, message);
                }
              });
            }
          }
          break;

        case 'ping':
          send(conn, { type: 'pong' });
      }
    }
  });
};

wss.on('connection', (conn, request) => {
  const url = request.url;
  onconnection(conn, url || '');
});

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('okay');
});

server.on('upgrade', (request, socket, head) => {
  const handleAuth = (ws: WebSocket) => {
    wss.emit('connection', ws, request);
  };
  wss.handleUpgrade(request, socket, head, handleAuth);
});

server.listen(port);

console.log('Signaling server running on port :', port);
