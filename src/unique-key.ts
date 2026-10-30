import { randomInt } from 'crypto';
import { UNIQUE_KEY_ALPHABET, UNIQUE_KEY_LENGTH } from './constants';
import { assertSlug } from './validation';

function randomKey(): string {
  return Array.from({ length: UNIQUE_KEY_LENGTH }, () => UNIQUE_KEY_ALPHABET[randomInt(UNIQUE_KEY_ALPHABET.length)]).join('');
}

/** Random key with at least one digit, so it always satisfies the app id pattern */
export function generateUniqueKey(): string {
  let key = randomKey();
  while (!/\d/.test(key)) key = randomKey();
  return key;
}

/** "jobdiva" -> "jobdiva-k7f3x". Run once when an app is created, then commit the result. */
export function createUniqueAppId(name: string): string {
  assertSlug('app name', name);
  return `${name}-${generateUniqueKey()}`;
}
