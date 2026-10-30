import type { PrefixedEvents } from './types';
import { assertEventName, assertSlug } from './validation';

/**
 * Declares an app's events under its slug so they cannot collide with another
 * app's events on the shared server.
 *
 *   export const EVENTS = defineEvents('jobdiva', { batchSubmit: 'batch.submit' });
 *   EVENTS.batchSubmit // 'jobdiva/batch.submit'
 */
export function defineEvents<const Slug extends string, const Events extends Record<string, string>>(
  slug: Slug,
  events: Events
): PrefixedEvents<Slug, Events> {
  assertSlug('event slug', slug);

  const prefixed = Object.fromEntries(
    Object.entries(events).map(([key, name]) => {
      assertEventName(name);
      return [key, `${slug}/${name}`];
    })
  );

  return Object.freeze(prefixed) as PrefixedEvents<Slug, Events>;
}
