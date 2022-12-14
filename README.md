# NestJS + GraphQL Schema First (Complete stack)

| NestJS                                                                | GraphQL                                                                                                                        | Docker                                                                                  | Kubernetes                                                                                                                                                             | Redis                                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| <img src="https://docs.nestjs.com/assets/logo-small.svg" width="70"/> | <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/GraphQL_Logo.svg/1200px-GraphQL_Logo.svg.png" width="70"/> | <img src="https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png" width="90"/> | <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Kubernetes_logo_without_workmark.svg/1200px-Kubernetes_logo_without_workmark.svg.png" width="75"/> | <img src="https://plugins.jetbrains.com/files/12820/199712/icon/pluginIcon.svg" width="80"/> |

This repository includes a full cycle NestJS stack to develop with containers:

- NestJS + GraphQL Schema First (default application generated by `@nestjs/cli`) with some configurations:
  - [`class-validator`](https://github.com/typestack/class-validator) package with middleware configured to show errors when input data don't matches with criteria's
  - [`nestjs-pino`](https://github.com/iamolegga/nestjs-pino): replaces built-in Nest logger to register outputs using JSON syntax and easily allow to collect with ElasticSearch or tools like that.
  - Modules to work with Redis:
    - `infra/redis-cache/redis-cache.module.ts`: To use Redis as key/value, useful for cache functionality, needs `cache-manager` (already installed)
    - `infra/redis-pubsub/redis-pubsub.module.ts`: To use Redis as Pub/Sub
    - `infra/redis-queue/redis-queue.module.ts`: To use Redis as queue and execute async tasks
  - [`ms`](https://github.com/vercel/ms): Allow to easily convert values from string to milliseconds, like `1d`, `1m`, etc.
  - [`@golevelup/ts-jest`](https://www.npmjs.com/package/@golevelup/ts-jest): Allow to easily create mocks from providers and use them on tests
- [Dockerfile](./Dockerfile) with multi-stage build and [`docker-compose`](./docker-compose.yml) to local development with live reload and debugger;
- [Redis](./k8s/redis/) (via Kubernetes with StatefulSet);
- [Dynatrace](./k8s/dynatrace/) (via Kubernetes) - you will need to configure OneAgent following the DynaTrace docs;
  - [OpenTelemetry](./opentelemetry.js) will be used for this.
- [Kubernetes deployments](./k8s/) - application, ingress and service;
- [Docker Desktop StorageClass fix](./k8s/docker-desktop/storageclass.yml) for Kubernetes (only when running locally);

## GraphQL

The GraphQL includes:

- Subscription handlers are configured
- `directive @deprecated` configured on `schema.graphql` for example purposes
- [`graphql-scalars`](https://the-guild.dev/graphql/scalars): allow to work with custom types and validate data
  - `scalar DateTime` declared on `schema.graphql` only for example purposes
- [`withCancel()` function to listen when client disconnect from `Subscription`](https://github.com/nestjs/graphql/issues/186#issuecomment-478238683)

## Requirements

- [Node.js](https://nodejs.org/en/) (v18);
- [Docker](https://www.docker.com/products/docker-desktop) (with Docker Compose);
- Kubernetes cluster (if you desire to use it);
- DynaTrace account (if you desire to use it);

## Configs

Environment variables are defined on:

- `.env` - for local development, via Docker and NodeJS. [Read more on this section](#configuring-environment-variables).
- `ConfigMap` - for production or another environment using Kubernetes. [On this location](./k8s/configmap.yml).

### Redis

The Redis auth credentials were changed to:

```bash
user default on +@pubsub ~* nopass
user admin on +@all ~* >adminpassword
```

Credentials:

| Username  | Scope    | Password                 |
| --------- | -------- | ------------------------ |
| `default` | `pubsub` | `nopass` (make it empty) |
| `admin`   | `all`    | `adminpassword`          |

> **Note:** you can change the credentials in the [`redis-configmap.yaml`](./k8s/redis/redis-configmap.yaml) file [on these lines](https://github.com/tiagoboeing/nestjs-graphql-schemafirst-docker-k8s/blob/5ad865af51fccf942550d991a662796b34f957ca/k8s/redis/redis-configmap.yaml#L768-L770).

#### Key prefix

The keys stored on Redis for all modules (Queue, PubSub, Cache) will have a prefix to avoid conflicts with other applications. The value is defined on the `REDIS_PREFIX` environment variable. The default value is the value of `name` property on `package.json` file.

| Resource/Module              | Key example            |
| ---------------------------- | ---------------------- |
| `Cache`/`RedisCacheModule`   | `prefix`:`cache`:`key` |
| `Queue`/`RedisQueueModule`   | `prefix`:`key`         |
| `PubSub`/`RedisPubSubModule` | `prefix`:`key`         |

### DynaTrace

If you don't want to use DynaTrace, you can remove the `opentelemetry.js` file and will need to remove the [`Dockerfile`](./Dockerfile) excluding `"--require", "./opentelemetry.js"` [on this line](https://github.com/tiagoboeing/nestjs-graphql-schemafirst-docker-k8s/blob/2c7daad63ea0fe7712353334aaa1d0702caee989/Dockerfile#L62).

## Workflow

### Local development

You can start the application locally with:

```bash
# with Docker Compose
# -V remove volumes
# --build rebuild the images
docker-compose up --build -V

# You can specify the app port with SERVER_PORT (default will be 3000)
SERVER_PORT=4000 docker-compose up --build -V

# or simply with NodeJS
npm run start:dev
```

#### Docker Compose

To access services (like mocks) on host machine, you can simply use the DNS: `host.docker.internal`

#### Configuring environment variables

You can configure the environment variables in the file [`.env`](./.env).

> **Note:** the `.env` file will be used ONLY for local development. On production or another environment, you will need to change it via [ConfigMap](./k8s/configmap.yml) (if using K8S).

#### Execute without Docker Compose

You don't need to use Docker Compose to development, but using Redis you will need to install and configure it before.

##### Run Redis with Docker

```bash
# Create Docker network
docker network create redis

# Run Redis, attach network and expose port
docker run -d --rm --network redis --name redis -p 6379:6379 redis:6.2.3-alpine
```

> In this case, **running out of the Docker network the Redis Host (`REDIS_HOST` env) will be `localhost` or `127.0.0.1`.** Replace on the `.env` file.

Now you can simply start like any other NestJS app:

```bash
npm run start:dev
```

> The advantage of use Docker to run all the stack is why all the configurations are made and the tunnel between the app and Redis will automatically defined. Redis host will be simply `redis` (Docker network name).

You can configure the environment variables in the file [`.env`](./.env).

> **Note:** the `.env` file will be used ONLY for local development. On production or another environment, you will need to change it via [ConfigMap](./k8s/configmap.yml) (if using K8S).

### Build

> On this repository we are using `integration` as the image name, but you can change it to whatever you want.

You can build the application with:

```bash
# Production build
# using multi-stage build
docker build --target production -t <image-name> .
```

#### Testing production image

```bash
docker run --rm -it -p 3000:3000 <image-name>
```

### Kubernetes cluster

> Firstly you will need to create a Kubernetes cluster. Use any engine, like [K3D](https://k3d.io/), [MiniKube](https://minikube.sigs.k8s.io/docs/start/), [Docker Desktop](https://www.docker.com/products/docker-desktop), etc.

**You can get start (only at the first time) simply running:**

```bash
# This command will create namespaces and apply deployments
sh ./k8s/start-k8s-cluster.sh
```

> **Note:** If you changed the Docker image name to other value (not `integration`), you will need to replace the K8S deployments with the new image.

## Notes/links

- [`.graphql` files need to be manually copied to the `dist` folder](https://github.com/nestjs/graphql/issues/135);
- [Defining log points with Pino](https://github.com/iamolegga/nestjs-pino#example)
- Error when adding `redisStore` on RedisCacheModule: [issue 1](https://github.com/node-cache-manager/node-cache-manager/issues/210), [issue 2](https://github.com/dabroek/node-cache-manager-redis-store/issues/40)
