# Impress

Impress is a web application for real-time collaborative text editing with user and role based access rights.
Features include : 
- User authentication through OIDC
- BlocNote.js text editing experience (markdown support, dynamic conversion, block structure, slash commands for block creation) 
- Document export to pdf and docx from predefined templates
- Granular document permissions
- Public link sharing

Impress is built on top of [Django Rest Framework](https://www.django-rest-framework.org/), [Next.js](https://nextjs.org/) and [BlocNote.js](https://www.blocknotejs.org/)

## Getting started

### Prerequisite

Make sure you have a recent version of Docker and [Docker
Compose](https://docs.docker.com/compose/install) installed on your laptop:

```bash
$ docker -v
  Docker version 20.10.2, build 2291f61

$ docker compose -v
  docker compose version 1.27.4, build 40524192
```

> ⚠️ You may need to run the following commands with `sudo` but this can be
> avoided by assigning your user to the `docker` group.

### Project bootstrap

The easiest way to start working on the project is to use GNU Make:

```bash
$ make bootstrap FLUSH_ARGS='--no-input'
```

Then you can access to the project in development mode by going to http://localhost:3000.
You will be prompted to log in, the default credentials are:
```bash
username: impress
password: impress
```
---

This command builds the `app` container, installs dependencies, performs
database migrations and compile translations. It's a good idea to use this
command each time you are pulling code from the project repository to avoid
dependency-releated or migration-releated issues.

Your Docker services should now be up and running 🎉

Note that if you need to run them afterwards, you can use the eponym Make rule:

```bash
$ make run-frontend-dev
```

### Adding content

You can create a basic demo site by running:

    $ make demo

Finally, you can check all available Make rules using:

```bash
$ make help
```

### Django admin

You can access the Django admin site at
[http://localhost:8071/admin](http://localhost:8071/admin).

You first need to create a superuser account:

```bash
$ make superuser
```

## Contributing

This project is intended to be community-driven, so please, do not hesitate to
get in touch if you have any question related to our implementation or design
decisions.

## License

This work is released under the MIT License (see [LICENSE](./LICENSE)).
