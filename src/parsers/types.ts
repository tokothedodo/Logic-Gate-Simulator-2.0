import { Circuit } from '../types';

export interface Parser {
  parse(data: string | ArrayBuffer): Circuit;
  serialize(circuit: Circuit): string;
  mimeTypes?: string[];
  extensions: string[];
  /** Notes from the most recent parse, shown to the user when something was dropped. */
  warnings?: string[];
}

export const NATIVE_SCHEMA_VERSION = '1.0.0';
