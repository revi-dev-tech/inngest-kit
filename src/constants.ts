/** Lowercase words joined by dashes, e.g. "jobdiva" or "jobdiva-cv-pipeline" */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** noun.verb style, e.g. "batch.submit" or "call.transcript-extract" */
export const EVENT_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$/;

/** Cap applied to functions that do not set their own, so none can take the whole shared worker pool */
export const DEFAULT_CONCURRENCY_LIMIT = 5;

/** Built-in event Inngest emits when a function exhausts its retries. Fires for every app on the server */
export const FUNCTION_FAILED_EVENT = 'inngest/function.failed';

export const FAILURE_LOGGER_FUNCTION_ID = 'log-inngest-failure';
export const FAILURE_LOGGER_FUNCTION_NAME = 'Log Inngest Failure';
export const FAILURE_LOGGER_RETRIES = 1;
