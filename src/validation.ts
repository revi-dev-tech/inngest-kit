import { APP_ID_PATTERN, EVENT_NAME_PATTERN, SLUG_PATTERN } from './constants';

function assertMatches(pattern: RegExp, label: string, value: string, hint: string): void {
  if (!pattern.test(value)) {
    throw new Error(`${label} "${value}" is invalid: ${hint}`);
  }
}

/** App ids and slugs end up in event names and a CEL `if` expression, so keep them boring */
export function assertSlug(label: string, value: string): void {
  assertMatches(SLUG_PATTERN, label, value, 'use lowercase letters, digits and dashes (e.g. "jobdiva")');
}

/** The unique key at the end is what stops two apps from registering under the same id */
export function assertAppId(value: string): void {
  assertMatches(
    APP_ID_PATTERN,
    'appId',
    value,
    'it must end with a unique key, generate one with "npx inngest-kit init <app-name>"'
  );
}

export function assertEventName(value: string): void {
  assertMatches(EVENT_NAME_PATTERN, 'event name', value, 'use lowercase noun.verb (e.g. "batch.submit")');
}
