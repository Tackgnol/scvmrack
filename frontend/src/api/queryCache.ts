import type {
  InvalidateQueryFilters,
  QueryClient,
} from "@tanstack/react-query";

/** Refresh a server snapshot without accepting reads started before the change. */
export async function refreshQueries(
  client: QueryClient,
  filters: InvalidateQueryFilters,
): Promise<void> {
  await client.cancelQueries(filters);
  await client.invalidateQueries(filters);
}
