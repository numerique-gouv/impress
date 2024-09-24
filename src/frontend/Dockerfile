FROM node:20-alpine as frontend-deps-y-provider

WORKDIR /home/frontend/

COPY ./src/frontend/package.json ./package.json
COPY ./src/frontend/yarn.lock ./yarn.lock
COPY ./src/frontend/servers/y-provider/package.json ./servers/y-provider/package.json
COPY ./src/frontend/packages/eslint-config-impress/package.json ./packages/eslint-config-impress/package.json

RUN yarn install

COPY ./src/frontend/ .

# Copy entrypoint
COPY ./docker/files/usr/local/bin/entrypoint /usr/local/bin/entrypoint

# ---- y-provider ----
FROM frontend-deps-y-provider as y-provider

WORKDIR /home/frontend/servers/y-provider
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

COPY .dockerignore ./.dockerignore
COPY ./src/frontend/ .

### ---- Front-end builder image ----
FROM frontend-deps as impress

WORKDIR /home/frontend/apps/impress

FROM frontend-deps as impress-dev

WORKDIR /home/frontend/apps/impress

EXPOSE 3000

CMD [ "yarn", "dev"]

# Tilt will rebuild impress target so, we dissociate impress and impress-builder 
# to avoid rebuilding the app at every changes.
FROM impress as impress-builder

WORKDIR /home/frontend/apps/impress

ARG FRONTEND_THEME
ENV NEXT_PUBLIC_THEME=${FRONTEND_THEME}

ARG Y_PROVIDER_URL
ENV NEXT_PUBLIC_Y_PROVIDER_URL=${Y_PROVIDER_URL}

ARG API_ORIGIN
ENV NEXT_PUBLIC_API_ORIGIN=${API_ORIGIN}

ARG CRISP_WEBSITE_ID
ENV NEXT_PUBLIC_CRISP_WEBSITE_ID=${CRISP_WEBSITE_ID}

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
