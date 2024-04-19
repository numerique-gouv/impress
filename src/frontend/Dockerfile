FROM node:20-alpine as frontend-deps-y-webrtc-signaling

WORKDIR /home/frontend/

COPY ./src/frontend/package.json ./package.json
COPY ./src/frontend/yarn.lock ./yarn.lock
COPY ./src/frontend/apps/y-webrtc-signaling/package.json ./apps/y-webrtc-signaling/package.json
COPY ./src/frontend/packages/eslint-config-impress/package.json ./packages/eslint-config-impress/package.json

RUN yarn install

COPY ./src/frontend/ .

# Copy entrypoint
COPY ./docker/files/usr/local/bin/entrypoint /usr/local/bin/entrypoint

# ---- y-webrtc-signaling ----
FROM frontend-deps-y-webrtc-signaling as y-webrtc-signaling

WORKDIR /home/frontend/apps/y-webrtc-signaling
RUN yarn build

# Un-privileged user running the application
ARG DOCKER_USER
USER ${DOCKER_USER}

ENTRYPOINT [ "/usr/local/bin/entrypoint" ]

CMD ["yarn", "start"]

FROM node:20-alpine as frontend-deps

WORKDIR /home/frontend/

COPY ./src/frontend/package.json ./package.json
COPY ./src/frontend/yarn.lock ./yarn.lock
COPY ./src/frontend/apps/impress/package.json ./apps/impress/package.json
COPY ./src/frontend/packages/eslint-config-impress/package.json ./packages/eslint-config-impress/package.json

RUN yarn install --frozen-lockfile

COPY ./src/frontend/ .

### ---- Front-end builder image ----
FROM frontend-deps as impress

WORKDIR /home/frontend/apps/impress

# Tilt will rebuild impress target so, we dissociate impress and impress-builder 
# to avoid rebuilding the app at every changes.
FROM impress as impress-builder

WORKDIR /home/frontend/apps/impress

RUN yarn build

# ---- Front-end image ----
FROM nginxinc/nginx-unprivileged:1.25 as frontend-production

# Un-privileged user running the application
ARG DOCKER_USER
USER ${DOCKER_USER}

COPY --from=impress-builder \
    /home/frontend/apps/impress/out \
    /usr/share/nginx/html

COPY ./src/frontend/apps/impress/conf/default.conf /etc/nginx/conf.d
COPY ./docker/files/usr/local/bin/entrypoint /usr/local/bin/entrypoint

ENTRYPOINT [ "/usr/local/bin/entrypoint" ]

CMD ["nginx", "-g", "daemon off;"]