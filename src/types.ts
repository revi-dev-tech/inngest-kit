/** Maps { batchSubmit: 'batch.submit' } to { batchSubmit: 'jobdiva/batch.submit' } at the type level */
export type PrefixedEvents<Slug extends string, Events extends Record<string, string>> = {
  readonly [Key in keyof Events]: `${Slug}/${Events[Key]}`;
};

/** Shape of `event.data` on Inngest's built-in function.failed event */
export type FunctionFailedData = {
  error?: { message?: string; name?: string; stack?: string };
  event?: { name?: string; data?: unknown };
  function_id?: string;
  run_id?: string;
};

export type FailureInfo = {
  /** Function id without the app id prefix, e.g. "hubspot-sync" */
  source: string;
  error: Error;
  eventName?: string;
  runId?: string;
  context: unknown;
};

export type FailureHandler = (failure: FailureInfo) => Promise<void> | void;
