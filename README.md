# Ticketing Microservices

A ticket resale app split into five small services. Users can sell
tickets for events, other users can reserve one, and they have a few
minutes to pay before the reservation runs out.

I built it to learn how separate services work together without sharing
a database.

## Services

| Service | What it does | Storage |
|---|---|---|
| `auth` | Sign up, sign in, sign out, current user | MongoDB |
| `tickets` | Create, list and edit tickets | MongoDB |
| `orders` | Reserve a ticket, list and cancel orders | MongoDB |
| `payments` | Charge an order with Stripe | MongoDB |
| `expiration` | Cancels orders that are not paid in time | Redis (Bull queue) |

Each service has its own database. They never read each other's data.
When something changes, the service sends an event over NATS Streaming,
and the other services keep their own copy of what they need.

All services are written in TypeScript with Express. Shared code (event
types, errors, auth middleware) is in a separate npm package,
`@omidrasticketsapp/common`.

## Events

```
tickets     --> ticket:created, ticket:updated      --> orders
orders      --> order:created                       --> tickets, payments, expiration
orders      --> order:cancelled                     --> tickets, payments
expiration  --> expiration:complete                 --> orders
payments    --> payment:created                     --> orders
```

An example: a user reserves a ticket.

1. `orders` saves the order and sends `order:created`.
2. `tickets` locks the ticket so nobody can edit it.
3. `expiration` adds a job to Redis that fires when the time is up.
4. If the user pays first, `payments` charges them through Stripe and
   sends `payment:created`, and the order is complete.
5. If the time runs out first, `expiration` sends `expiration:complete`,
   `orders` cancels the order, and the ticket is free again.

Events can arrive in the wrong order. Every ticket has a version number
(`mongoose-update-if-current`), and a service only applies an update if
it is the next version. Otherwise the event is not acknowledged and NATS
sends it again later.

## API

All routes go through one ingress:

| Path | Service |
|---|---|
| `/api/users/signup`, `/signin`, `/signout`, `/current-user` | auth |
| `/api/tickets`, `/api/tickets/:id` | tickets |
| `/api/orders`, `/api/orders/:id` | orders |
| `/api/payments` | payments |

Login uses a JWT stored in a cookie, so every service can check the user
on its own without calling `auth`.

## Running it

It runs on Kubernetes. You need a local cluster (Docker Desktop works),
ingress-nginx and Skaffold.

1. Add `127.0.0.1 omidapp.dev` to your hosts file.
2. Create the secrets:

```
kubectl create secret generic jwt-secret --from-literal=JWT_SECRET_KEY=<anything>
kubectl create secret generic stripe-secret --from-literal=STRIPE_SECRET_KEY=<your Stripe test key>
```

3. Start everything:

```
skaffold dev
```

Skaffold builds the images, applies the files in `infra/k8s`, and syncs
code changes into the running pods.

## Tests

Each service has Jest and Supertest tests that run against an in-memory
MongoDB, with NATS mocked out.

```
cd orders
npm test
```

GitHub Actions runs the tests of a service on every pull request that
changes that service.

## Stack

TypeScript, Node.js, Express, MongoDB, Mongoose, Redis, Bull, NATS
Streaming, Stripe, Docker, Kubernetes, Skaffold, Jest, GitHub Actions.
