FROM node:20-alpine AS dependencies

WORKDIR /home/blocknote

COPY ./src/blocknote/package*.json ./

RUN npm install

COPY .dockerignore ./.dockerignore
COPY ./src/blocknote/ .

FROM dependencies AS blocknote-builder

WORKDIR /home/blocknote

RUN npm run build

# ---- Blocknote image ----
FROM blocknote-builder AS production

# Un-privileged user running the application
ARG DOCKER_USER
USER ${DOCKER_USER}

COPY ./docker/files/usr/local/bin/entrypoint /usr/local/bin/entrypoint

ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["npm", "run", "start"]
