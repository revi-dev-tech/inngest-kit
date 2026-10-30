import type { Inngest } from 'inngest';
import {
  FAILURE_LOGGER_FUNCTION_ID,
  FAILURE_LOGGER_FUNCTION_NAME,
  FAILURE_LOGGER_RETRIES,
  FUNCTION_FAILED_EVENT,
} from './constants';
import type { FailureHandler, FailureInfo, FunctionFailedData } from './types';
import { assertAppId } from './validation';

/** Inngest prefixes every function id with its app id, e.g. "jobdiva-cv-pipeline-hubspot-sync" */
function functionIdPrefix(appId: string): string {
  return `${appId}-`;
}

function toFailureInfo(data: FunctionFailedData, prefix: string): FailureInfo {
  const rawFunctionId = data.function_id ?? 'unknown';
  const source = rawFunctionId.startsWith(prefix) ? rawFunctionId.slice(prefix.length) : rawFunctionId;

  const error = new Error(data.error?.message ?? 'Unknown error');
  error.name = data.error?.name ?? 'Error';
  if (data.error?.stack) error.stack = data.error.stack;

  return {
    source,
    error,
    eventName: data.event?.name,
    runId: data.run_id,
    context: data.event?.data ?? null,
  };
}

/**
 * Records the final failure (after retries) of this app's functions.
 *
 * `inngest/function.failed` fires for every app on a shared server, so the
 * trigger is filtered to function ids starting with the app id. Without that
 * filter this app would log other apps' failures.
 */
export function createFailureLogger(
  client: Inngest.Any,
  { appId, onFailure }: { appId: string; onFailure: FailureHandler }
) {
  assertAppId(appId);
  const prefix = functionIdPrefix(appId);

  return client.createFunction(
    {
      id: FAILURE_LOGGER_FUNCTION_ID,
      name: FAILURE_LOGGER_FUNCTION_NAME,
      retries: FAILURE_LOGGER_RETRIES,
    },
    { event: FUNCTION_FAILED_EVENT, if: `event.data.function_id.startsWith('${prefix}')` },
    async ({ event }) => {
      const failure = toFailureInfo(event.data as FunctionFailedData, prefix);
      await onFailure(failure);
      return { logged: true, source: failure.source };
    }
  );
}
