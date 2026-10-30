# AI onboarding: register an app on the shared Inngest server

Audience: an AI coding agent working in an app repo that must run its Inngest functions on the shared, self-hosted Inngest server. Follow the steps in order. Do exactly what is written. Do not improvise names, ids or env vars.

## Ground rules (read first)

1. You never need the server URL or any key. The owner supplies those values and sets them as environment variables on the host. Never ask for the values in chat, never write them into any file, never commit them, never print them.
2. The app id is permanent. Generate it once with the CLI (step 3). Never invent one, never copy another app's id, never regenerate it after it is committed.
3. Never send an event with a raw string name. Every event name comes from `EVENTS` (step 4).
4. Never create a function without `withDefaults` (step 5).
5. Do not push or deploy to production before the owner confirms the env vars are set (step 8). A deploy without them sends events to the wrong place.
6. Keep events and step return values small. Store large data in the app's database and pass an id.
7. When a step says "ask the owner", stop and ask. Do not continue past it.

## Placeholders you will see

| Placeholder | Meaning | Who provides it |
|---|---|---|
| `<APP_NAME>` | lowercase words joined by dashes, e.g. `billing-api` | you, from the repo name |
| `<APP_ID>` | output of `npx inngest-kit init <APP_NAME>`, e.g. `billing-api-k7f3x` | the CLI |
| `<INNGEST_PROXY_URL>` | https address of the shared server | the owner, never you |
| `<INNGEST_EVENT_KEY>` | event key of the shared server | the owner, never you |
| `<INNGEST_SIGNING_KEY>` | signing key of the shared server | the owner, never you |

## Step 1: check the prerequisites

- The app depends on `inngest` at a version `>=3.40.0 <4`. If it does not, add `inngest@^3` first.
- The app is a Node project with a framework that can serve an Inngest endpoint (Next.js shown below; other frameworks use their own `serve` adapter from `inngest/<framework>`).
- If the app already has Inngest functions on Inngest Cloud, tell the owner before you continue: renaming the app id and events orphans runs that are still in flight on Cloud, so the owner must drain them first.

## Step 2: install the kit

```
npm install github:revi-dev-tech/inngest-kit#v1.1.1
```

The repo is public, so no token is needed. The package builds itself on install.

Then open `package-lock.json` and find the `node_modules/@revi/inngest-kit` entry. Its `resolved` value must start with `git+https://github.com/`. If it starts with `git+ssh://git@github.com/`, replace that prefix with `git+https://github.com/` and keep the `#<commit>` suffix. Hosts such as Vercel have no SSH key, so an ssh URL breaks their install.

## Step 3: generate the app id (once)

```
npx inngest-kit init <APP_NAME>
```

The output is `<APP_ID>`. Save it as a constant and commit it:

```ts
// lib/constants/inngest.ts
export const INNGEST_APP_ID = '<APP_ID>';
```

Never change this value afterwards.

## Step 4: client and events

```ts
// inngest/client.ts
import { createInngestClient } from '@revi/inngest-kit';
import { INNGEST_APP_ID } from '@/lib/constants/inngest';

export const inngest = createInngestClient({ appId: INNGEST_APP_ID });
```

```ts
// lib/constants/inngest-events.ts
import { defineEvents } from '@revi/inngest-kit';
import { INNGEST_APP_ID } from './inngest';

export const EVENTS = defineEvents(INNGEST_APP_ID, {
  orderCreated: 'order.created', // format: noun.verb, lowercase, dashes allowed
});
```

`EVENTS.orderCreated` is `'<APP_ID>/order.created'`. Use `EVENTS.*` everywhere: in `inngest.send`, `step.sendEvent`, triggers and `cancelOn`.

If the app already has event names as raw strings, replace every one with an `EVENTS.*` constant, including strings inside comments, and search the whole repo (routes, services, tests) so none is left.

## Step 5: functions

Wrap every function config in `withDefaults`. It adds a concurrency limit of 5 when you do not set one.

```ts
import { withDefaults } from '@revi/inngest-kit';
import { inngest } from '@/inngest/client';
import { EVENTS } from '@/lib/constants/inngest-events';

export const handleOrder = inngest.createFunction(
  withDefaults({ id: 'handle-order', name: 'Handle Order', retries: 3 }),
  { event: EVENTS.orderCreated },
  async ({ event, step }) => { /* ... */ }
);
```

Cron functions use `{ cron: 'TZ=<zone> <expr>' }` as the trigger and also use `withDefaults`.

## Step 6: failure logger

`inngest/function.failed` fires for every app on the shared server. Use the kit's logger, which only reports this app's functions. Never listen to that event yourself.

```ts
// inngest/functions/error-log.ts
import { createFailureLogger } from '@revi/inngest-kit';
import { inngest } from '@/inngest/client';
import { INNGEST_APP_ID } from '@/lib/constants/inngest';

export const logInngestFailure = createFailureLogger(inngest, {
  appId: INNGEST_APP_ID,
  onFailure: ({ source, error, eventName, runId, context }) =>
    // write to the app's own error log, or console.error if it has none
    console.error({ source, error, eventName, runId, context }),
});
```

## Step 7: serve endpoint

Register every function, including `logInngestFailure`, in the serve route.

```ts
// app/api/inngest/route.ts (Next.js)
import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { handleOrder } from '@/inngest/functions/handle-order';
import { logInngestFailure } from '@/inngest/functions/error-log';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [handleOrder, logInngestFailure],
});
```

The `/api/inngest` route must be reachable without the app's own login. Inngest verifies each request by signature. If the app has auth middleware, add `/api/inngest` to its public paths. If the host has deployment protection (for example Vercel), tell the owner it must allow this path.

Run the typecheck. It must pass with no errors in the files you changed.

## Step 8: environment variables (owner action)

Stop here and tell the owner exactly this:

> Set these three variables on the host for the production environment, then redeploy. Use the values from the Inngest server owner. `INNGEST_DEV` must be unset or `0`.
>
> ```
> INNGEST_BASE_URL=<INNGEST_PROXY_URL>
> INNGEST_EVENT_KEY=<INNGEST_EVENT_KEY>
> INNGEST_SIGNING_KEY=<INNGEST_SIGNING_KEY>
> ```
>
> `INNGEST_BASE_URL` is the public https address of the shared server, never an internal `.railway.internal` address, because the app does not run inside that network.

Wait for the owner to confirm. Do not read, request or log the values.

For local development only: set `INNGEST_DEV=1` and run `npx inngest-cli@latest dev -u http://localhost:<port>/api/inngest`. Do not put the shared keys in a local env file.

## Step 9: registry entry

Open a pull request on `revi-dev-tech/inngest-kit` that adds one row to `REGISTRY.md`:

```
| <APP_ID> | <owner name> | <org/repo> | <YYYY-MM-DD> |
```

If `<APP_ID>` already appears in that file, you copied another app's id: go back to step 3 and generate a new one.

## Step 10: deploy and sync

1. Push and deploy the app (only after step 8 is confirmed).
2. Register the app with the server:
   ```
   curl -X PUT https://<app-host>/api/inngest
   ```
   Expected response: `{"message":"Successfully registered",...}`.
3. A plain `GET` to `/api/inngest` returning `{"message":"Unauthorized"}` is normal. It means signature checking is on.

## Step 11: verify

Ask the owner to open the server dashboard (login is held by the owner) and confirm:

- The app `<APP_ID>` is listed as connected with the expected number of functions.
- Each cron function shows its schedule.
- Event triggers start with `<APP_ID>/`.
- Send one real event and see the run finish under Runs.

Optional but recommended: add a tiny health-ping function (an event `health.ping` that records it was received) so the owner can prove the server can reach the app.

## Failure guide

| Symptom | Cause | Fix |
|---|---|---|
| `npm install` fails on the host with an ssh or auth error | lockfile uses `git+ssh` | step 2, switch to `git+https` |
| Sync returns an error about signing | wrong or missing `INNGEST_SIGNING_KEY` | ask the owner to re-check the variable and redeploy |
| Events are accepted but no run starts | function not in the serve list, or app not synced | step 7, then step 10 |
| Sync works but the server cannot call the app | host deployment protection or app auth blocks `/api/inngest` | step 7 |
| Functions show up under the wrong app | app id was changed after first sync | restore the original id from git history |
| Another app's failures appear in the error log | the app listens to `inngest/function.failed` directly | use `createFailureLogger` (step 6) |

## Done when

- Typecheck passes and no raw event strings remain.
- `<APP_ID>` is committed once and registered in `REGISTRY.md`.
- The owner set the three variables and confirmed the dashboard shows the app connected.
- One real event ran to completion.
