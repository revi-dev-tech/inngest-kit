import { DEFAULT_CONCURRENCY_LIMIT } from './constants';

/**
 * Fills in a concurrency limit when a function does not set one. Pass the usual
 * function config:
 *
 *   inngest.createFunction(withDefaults({ id: 'hubspot-sync', retries: 3 }), trigger, handler)
 */
export function withDefaults<const Config extends { id: string; concurrency?: unknown }>(config: Config) {
  return { concurrency: { limit: DEFAULT_CONCURRENCY_LIMIT }, ...config };
}
