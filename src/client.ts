import { Inngest } from 'inngest';
import { assertAppId } from './validation';

/**
 * Builds the Inngest client for an app. The app id must be unique across every
 * app registered on the shared server. Keys and base URL come from the
 * INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY and INNGEST_BASE_URL env vars.
 */
export function createInngestClient({ appId }: { appId: string }) {
  assertAppId(appId);
  return new Inngest({ id: appId });
}
