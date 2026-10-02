import { Circuit } from '../types';
import { Parser, NATIVE_SCHEMA_VERSION } from './types';

export class JsonParser implements Parser {
  extensions = ['.json'];

  parse(data: string | ArrayBuffer): Circuit {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    const parsed = JSON.parse(text);
    const circuit: Circuit = {
      id: parsed.id || 'circuit',
      name: parsed.name || 'Untitled',
      components: parsed.components || [],
      connections: parsed.connections || [],
      metadata: parsed.metadata || {
        version: NATIVE_SCHEMA_VERSION,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      },
    };
    return circuit;
  }

  serialize(circuit: Circuit): string {
    const toSerialize: Circuit = {
      ...circuit,
      metadata: {
        version: NATIVE_SCHEMA_VERSION,
        created: circuit.metadata?.created || new Date().toISOString(),
        modified: new Date().toISOString(),
      },
    };
    return JSON.stringify(toSerialize, null, 2);
  }
}
