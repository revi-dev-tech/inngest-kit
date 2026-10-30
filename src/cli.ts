#!/usr/bin/env node
import { createUniqueAppId } from './unique-key';

const USAGE = 'Usage: inngest-kit init <app-name>';

function main(): void {
  const [command, name] = process.argv.slice(2);

  if (command !== 'init' || !name) {
    console.error(USAGE);
    process.exit(1);
  }

  console.log(createUniqueAppId(name));
}

try {
  main();
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
