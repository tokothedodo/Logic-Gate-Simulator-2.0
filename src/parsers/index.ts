export * from './types';
export * from './jsonParser';
export * from './gcgParser';
export * from './circParser';

import { JsonParser } from './jsonParser';
import { GcgParser } from './gcgParser';
import { CircParser } from './circParser';

export const parsers = [new JsonParser(), new GcgParser(), new CircParser()];

export const getParserForExtension = (ext: string) => {
  return parsers.find((p) => p.extensions.includes(ext.toLowerCase()));
};
