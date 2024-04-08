FROM node:20-alpine as y-webrtc-signaling

WORKDIR /home/frontend/

COPY ./package.json .
COPY ./apps/y-webrtc-signaling/package.json ./apps/y-webrtc-signaling/
COPY ./packages/eslint-config-impress/package.json ./packages/eslint-config-impress/

RUN yarn install

COPY . .

WORKDIR /home/frontend/apps/y-webrtc-signaling

RUN yarn build

CMD ["yarn", "start"]