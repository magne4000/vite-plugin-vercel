import { type EntryMeta, getAllEntries } from "@universal-deploy/store";
import type { fromRou3 } from "convert-route";

export type RouteIR = ReturnType<typeof fromRou3>;

/**
 * When multiple entries point to the same module, we can deploy them as a single function.
 * Create a separate function only when specific configuration is provided (`isr`, `headers`, `edge` or `streaming`).
 */
export function dedupeRoutes(): EntryMeta[] {
  const entriesToKeep: EntryMeta[] = [];

  const entriesGroupedByModuleId = groupBy(getAllEntries(), (e) => e.id);
  for (const entries of entriesGroupedByModuleId.values()) {
    let groupedEntry: EntryMeta | undefined;

    for (const entry of entries) {
      // For now, we do not try to be too smart, we only check if there is specific vercel configs attached to the entry
      if (entry.vercel && Object.keys(entry.vercel).length > 0) {
        if (!Array.isArray(entry.route)) {
          entry.route = [entry.route];
        }
        entriesToKeep.push(entry);
      } else if (!groupedEntry) {
        groupedEntry = structuredClone(entry);
        if (!Array.isArray(groupedEntry.route)) {
          groupedEntry.route = [groupedEntry.route];
        }
        entriesToKeep.push(groupedEntry);
      } else {
        // biome-ignore lint/suspicious/noExplicitAny: array enforced at creation
        (groupedEntry.route as any[]).push(...[entry.route].flat());
      }
    }
  }

  return entriesToKeep;
}

/**
 * Sorts routes by specificity.
 *
 * Specificity rules:
 * 1. Segment type priority at each position: Static > Dynamic/Param > Catch-all.
 * 2. Total route length: Longer routes are generally more specific.
 * 3. Prefix match exception: A shorter static route is more specific than a longer route
 *    that only adds a catch-all segment to the same prefix.
 * 4. Alphabetical order: Final tie-breaker for static segments at the same position.
 *
 * @param routes - Array of routes to sort.
 * @returns A new array of routes sorted from most specific to least specific.
 */
export function sortRoutes(routes: RouteIR[]): RouteIR[] {
  return [...routes].sort((a, b) => {
    const lenA = a.pathname.length;
    const lenB = b.pathname.length;
    const commonLen = Math.min(lenA, lenB);

    for (let i = 0; i < commonLen; i++) {
      const segA = a.pathname[i];
      const segB = b.pathname[i];

      // Static segments have highest priority
      if (segA.value && !segB.value) return -1;
      if (!segA.value && segB.value) return 1;

      // Both static
      if (segA.value && segB.value) {
        if (segA.value !== segB.value) {
          // If they differ, the one that leads to a longer route is more specific
          if (lenA !== lenB) return lenB - lenA;
          return segA.value.localeCompare(segB.value);
        }
      }

      // Required before optional
      if (!segA.optional && segB.optional) return -1;
      if (segA.optional && !segB.optional) return 1;

      // Catch-all comparison
      if (segA.catchAll && segB.catchAll) {
        // Non-greedy before greedy
        if (!segA.catchAll.greedy && segB.catchAll.greedy) return -1;
        if (segA.catchAll.greedy && !segB.catchAll.greedy) return 1;
      }

      if (segA.catchAll && !segB.catchAll) return 1;
      if (!segA.catchAll && segB.catchAll) return -1;
    }

    if (lenA !== lenB) {
      if (lenA > lenB) {
        return a.pathname[lenB].catchAll ? 1 : -1;
      }
      return b.pathname[lenA].catchAll ? -1 : 1;
    }

    return 0;
  });
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
