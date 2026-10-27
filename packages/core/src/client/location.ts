export function resolveLocation(location: Location | URL): Location | URL {
  // Blob workers have no hostname or port, so resolve them from their origin.
  if (
    typeof URL !== 'undefined' &&
    location.protocol === 'blob:' &&
    location.origin &&
    location.origin !== 'null'
  ) {
    return new URL(location.origin);
  }
  return location;
}
