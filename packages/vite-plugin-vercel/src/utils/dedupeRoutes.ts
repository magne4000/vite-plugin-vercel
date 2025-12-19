import { type EntryMeta, store } from "@universal-deploy/store";

// FIXME unit test this
/**
 * When multiple entries point to the same module, we can deploy them as a single function.
 * Create a separate function only when specific configuration is provided (`isr`, `headers`, `edge` or `streaming`).
 */
export function dedupeRoutes(): EntryMeta[] {
  const entriesToKeep: EntryMeta[] = [];

  const entriesGroupedByModuleId = groupBy(store.entries, (e) => e.id);
  for (const entries of entriesGroupedByModuleId.values()) {
    // biome-ignore lint/style/noNonNullAssertion: contains at least one element
    const first = entries.shift()!;
    const groupedEntry = structuredClone(first);
    if (!Array.isArray(groupedEntry.pattern)) {
      groupedEntry.pattern = [groupedEntry.pattern];
    }
    entriesToKeep.push(groupedEntry);
    for (const entry of entries) {
      // For now, we do not try to be too smart, we only check if there is specific vercel configs attached to the entry
      if (entry.vercel && Object.keys(entry.vercel).length > 0) {
        entriesToKeep.push(entry);
      } else {
        groupedEntry.pattern.push(...[entry.pattern].flat());
      }
    }
  }

  return entriesToKeep;
}

export function groupBy<T, K extends string | null>(list: Iterable<T>, fn: (a: T) => K): Map<K, T[]>;
export function groupBy<T, K extends string | null, U>(
  list: Iterable<T>,
  fn: (a: T) => K,
  selector: (a: T) => Iterable<U>,
): Map<K, U[]>;
export function groupBy<T, K extends string | null, U>(
  list: Iterable<T>,
  fn: (a: T) => K,
  selector?: (a: T) => Iterable<U>,
): Map<K, (T | U)[]> {
  return Array.from(list).reduce((acc, curr) => {
    const key = fn(curr);
    // init empty key
    if (!acc.has(key)) acc.set(key, []);
    if (selector) {
      // biome-ignore lint/style/noNonNullAssertion: ok
      acc.get(key)!.push(...selector(curr));
    } else {
      // biome-ignore lint/style/noNonNullAssertion: ok
      acc.get(key)!.push(curr);
    }
    return acc;
  }, new Map<K, (T | U)[]>());
}
