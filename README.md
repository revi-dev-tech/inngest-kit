# @revi/inngest-kit

Shared Inngest setup for Revi apps that run on one shared, self-hosted Inngest server. It keeps apps from clashing: every app gets a unique id with a random key at the end, event names are built from that id, functions get a default concurrency cap, and the failure logger is scoped to the app.

AI agents onboarding a new app: follow [AI_ONBOARDING.md](AI_ONBOARDING.md) step by step.

## Install

```
npm install github:revi-dev-tech/inngest-kit#v1.1.1
```

The package builds itself on install (`prepare` script). `inngest` is a peer dependency, so the app must already depend on it.

To upgrade, change the tag in the app's `package.json` and run `npm install`.

## Create an app id (once per app)

```
npx inngest-kit init jobdiva
# jobdiva-k7f3x
```

The output is the app id. Commit it as a constant and never regenerate it: the id is the app's identity on the server, so changing it orphans in-flight runs and cron schedules. Then add the id to [REGISTRY.md](REGISTRY.md) in a pull request.

The key is 5 random characters at the end of the name and always contains a digit. The package refuses any app id without one.

## Usage

```ts
// lib/constants/inngest.ts
export const INNGEST_APP_ID = 'jobdiva-k7f3x';
```

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
  batchSubmit: 'batch.submit',
  hubspotSync: 'candidate.hubspot-sync',
});

EVENTS.batchSubmit; // 'jobdiva-k7f3x/batch.submit'
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
  appId: INNGEST_APP_ID,
  onFailure: ({ source, error, eventName, runId, context }) =>
    logError({ source, error, eventName, runId, context }),
});
```

## Environment variables (set on each app)

```
INNGEST_BASE_URL=<public https address of the shared server, given by the server owner>
# never a .railway.internal address: apps do not run inside that network
INNGEST_EVENT_KEY=<same as the server>
INNGEST_SIGNING_KEY=<same as the server>
```

## Rules for a new app

1. Run `npx inngest-kit init <name>` and use the result as the app id. Never copy another app's id.
2. Add the id to [REGISTRY.md](REGISTRY.md) in a pull request. This catches the one case the random key cannot: a cloned repo that still carries the old app's id.
3. Define every event with `defineEvents`. Never send raw event name strings.
4. Wrap every function config in `withDefaults` so no function runs without a concurrency limit.
5. Register the failure logger so only this app's failures are recorded.
6. Keep events and step results small. Store large data in the app's database and pass IDs.

## Layout

```
src/
  index.ts           public exports
  cli.ts             "inngest-kit init <name>" command
  constants.ts       patterns, defaults, built-in event and logger ids
  types.ts           shared types
  validation.ts      app id, slug and event name checks
  unique-key.ts      key generation and createUniqueAppId
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
