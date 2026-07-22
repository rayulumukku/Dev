import { Location, Position } from './types.js';

export class ReferenceProvider {
  getReferences(uri: string, position: Position, content: string): Location[] {
    const locations: Location[] = [];
    locations.push({
      uri,
      range: { start: position, end: position },
    });
    return locations;
  }
}
