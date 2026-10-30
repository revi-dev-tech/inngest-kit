# @revi/inngest-kit

Shared Inngest setup for Revi apps that run on one shared, self-hosted Inngest server. It keeps apps from clashing by enforcing unique app ids, prefixed event names, a default concurrency cap, and a failure logger scoped to the app.

## Install

```
npm install github:revi-dev-tech/inngest-kit#v1.0.0
```

The package builds itself on install (`prepare` script). `inngest` is a peer dependency, so the app must already depend on it.

To upgrade, change the tag in the app's `package.json` and run `npm install`.

## Usage

```ts
// inngest/client.ts
import { createInngestClient } from '@revi/inngest-kit';

export const inngest = createInngestClient({ appId: 'jobdiva-cv-pipeline' });
```

```ts
// lib/constants/inngest-events.ts
import { defineEvents } from '@revi/inngest-kit';

export const EVENTS = defineEvents('jobdiva', {
  batchSubmit: 'batch.submit',
  hubspotSync: 'candidate.hubspot-sync',
});

EVENTS.batchSubmit; // 'jobdiva/batch.submit'
```

```ts
// inngest/functions/hubspot-sync.ts
import { withDefaults } from '@revi/inngest-kit';

export const hubspotSync = inngest.createFunction(
  withDefaults({ id: 'hubspot-sync', retries: 3 }), // concurrency defaults to 5
  { event: EVENTS.hubspotSync },
  async ({ event, step }) => { /* ... */ }
);
```

```ts
// inngest/functions/error-log.ts
import { createFailureLogger } from '@revi/inngest-kit';

export const logInngestFailure = createFailureLogger(inngest, {
  appId: 'jobdiva-cv-pipeline',
  onFailure: ({ source, error, eventName, runId, context }) =>
    logError({ source, error, eventName, runId, context }),
});
```

## Environment variables (set on each app)

```
INNGEST_BASE_URL=http://<inngest-service>.railway.internal:8288
INNGEST_EVENT_KEY=<same as the server>
INNGEST_SIGNING_KEY=<same as the server>
```

## Rules for a new app

1. Pick a unique `appId` (lowercase, dashes). It must not match any other app on the server.
2. Pick an event slug and define every event with `defineEvents`. Never send raw event name strings.
3. Wrap every function config in `withDefaults` so no function runs without a concurrency limit.
4. Register the failure logger so only this app's failures are recorded.
5. Keep events and step results small. Store large data in the app's database and pass IDs.

## Layout

```
src/
  index.ts           public exports
  constants.ts       patterns, defaults, built-in event and logger ids
  types.ts           shared types
  validation.ts      slug and event name checks
  client.ts          createInngestClient
  events.ts          defineEvents
  defaults.ts        withDefaults
  failure-logger.ts  createFailureLogger
```

## Releasing

```
npm run typecheck
git tag vX.Y.Z && git push --tags
```

`dist` is not committed. Apps build it on install.
