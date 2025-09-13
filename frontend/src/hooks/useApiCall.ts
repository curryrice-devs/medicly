import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";

// Base API response type
type ApiResponse<T> = {
  data?: T;
  error?: string;
  success: boolean;
};

// Generic fetch wrapper with proper error handling
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Network error" }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "API request failed");
  }

  return result.data!;
}

// Hook for GET requests (queries)
export function useApiQuery<T>(
  key: string | (string | number)[],
  url: string,
  options?: Omit<UseQueryOptions<T, Error, T, string[]>, "queryKey" | "queryFn">,
) {
  const queryKey = Array.isArray(key) ? key.map(String) : [key];

  return useQuery({
    queryKey,
    queryFn: () => apiFetch<T>(url),
    ...options,
  });
}

// Hook for POST/PUT/DELETE requests (mutations)
export function useApiMutation<TData, TVariables = Record<string, unknown>>(
  url: string,
  method: "POST" | "PUT" | "DELETE" | "PATCH" = "POST",
  options?: {
    invalidateQueries?: string[][];
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
  } & Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      return apiFetch<TData>(url, {
        method,
        body: JSON.stringify(variables),
      });
    },
    onSuccess: (data: TData, variables: TVariables) => {
      // Invalidate specified queries
      options?.invalidateQueries?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });

      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
    ...options,
  });
}

// Utility for building query keys with parameters
export function buildQueryKey(base: string, params?: Record<string, unknown>): string[] {
  if (!params) return [base];

  const paramString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join(",");

  return paramString ? [base, paramString] : [base];
}

// Hook for queries with parameters
export function useApiQueryWithParams<T>(
  baseKey: string,
  url: string,
  params?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<T, Error, T, string[]>, "queryKey" | "queryFn">,
) {
  const queryKey = buildQueryKey(baseKey, params);
  const urlWithParams = params ? `${url}?${new URLSearchParams(params).toString()}` : url;

  return useQuery({
    queryKey,
    queryFn: () => apiFetch<T>(urlWithParams),
    ...options,
  });
} 