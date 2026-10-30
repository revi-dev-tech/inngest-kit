import type { PrefixedEvents } from './types';
import { assertAppId, assertEventName } from './validation';

/**
 * Declares an app's events under its unique app id so they cannot collide with
 * another app's events on the shared server.
 *
 *   export const EVENTS = defineEvents('jobdiva-k7f3x', { batchSubmit: 'batch.submit' });
 *   EVENTS.batchSubmit // 'jobdiva-k7f3x/batch.submit'
 */
export function defineEvents<const AppId extends string, const Events extends Record<string, string>>(
  appId: AppId,
  events: Events
): PrefixedEvents<AppId, Events> {
  assertAppId(appId);

  const prefixed = Object.fromEntries(
    Object.entries(events).map(([key, name]) => {
      assertEventName(name);
      return [key, `${appId}/${name}`];
    })
  );

  return Object.freeze(prefixed) as PrefixedEvents<AppId, Events>;
}
