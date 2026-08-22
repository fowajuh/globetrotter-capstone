import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";

/** Reads from the shared ["me"] query cache — cheap after the first fetch
 *  anywhere in the app (Settings/Profile prime it), and degrades to USD
 *  for logged-out or not-yet-loaded states rather than blocking render. */
export function useHomeCurrency(): string {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: usersApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  return data?.homeCurrency ?? "USD";
}
