/** Lowercase words joined by dashes, e.g. "jobdiva" or "jobdiva-cv-pipeline" */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const UNIQUE_KEY_LENGTH = 5;
export const UNIQUE_KEY_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * App id = lowercase words, then a dash and a 5-char key that contains at least
 * one digit, e.g. "jobdiva-k7f3x". The digit rule keeps a plain word like
 * "batch" from passing as a key.
 */
export const APP_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*-(?=[a-z]*\d)[a-z0-9]{5}$/;

/** noun.verb style, e.g. "batch.submit" or "call.transcript-extract" */
export const EVENT_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$/;

/** Cap applied to functions that do not set their own, so none can take the whole shared worker pool */
export const DEFAULT_CONCURRENCY_LIMIT = 5;

/** Built-in event Inngest emits when a function exhausts its retries. Fires for every app on the server */
export const FUNCTION_FAILED_EVENT = 'inngest/function.failed';

export const FAILURE_LOGGER_FUNCTION_ID = 'log-inngest-failure';
export const FAILURE_LOGGER_FUNCTION_NAME = 'Log Inngest Failure';
export const FAILURE_LOGGER_RETRIES = 1;
