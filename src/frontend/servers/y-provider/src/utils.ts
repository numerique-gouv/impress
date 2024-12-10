/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { COLLABORATION_LOGGING } from './env';

export function logger(...args: any[]) {
  if (COLLABORATION_LOGGING === 'true') {
    console.log(...args);
  }
}
