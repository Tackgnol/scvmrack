import { CharacterProvider } from "@/CharacterContext/CharacterContext";
import { ErrorFeedbackProvider } from "@/components/molecules/feedback/ErrorFeedbackProvider";
import { SnackbarProvider } from "@/SnackbarContext/SnackbarProvider";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { LazyMotion, domMax } from "motion/react";
import * as Sentry from "@sentry/react";
import React from "react";
import { shouldCaptureClientError } from "@/utils/errorUtils";
import { monitoringOperation } from "@/monitoring";

const captureClientError = (error: unknown, key?: readonly unknown[]): void => {
  if (shouldCaptureClientError(error)) {
    Sentry.captureException(error, {
      tags: { operation: monitoringOperation(key) },
    });
  }
};

// Shared by every entry point (main app + Owlbear Rodeo). Holds everything
// that is route-agnostic: error boundary, snackbars, query client, character
// context and motion features. Each entry supplies its own router/layout as
// children, and its own analytics/instrumentation side effects.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => captureClientError(error, query.queryKey),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) =>
      captureClientError(error, mutation.options.mutationKey),
  }),
});

const RuntimeErrorFallback = React.lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

export function CoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <React.StrictMode>
      <Sentry.ErrorBoundary
        fallback={
          <React.Suspense fallback={null}>
            <RuntimeErrorFallback
              homeLinkMode="anchor"
              heading="500"
              stamp="Runtime Error"
              tagline="The sheet tore. We have the blood trail."
              seoTitle="Runtime error"
              seoDescription="The app hit an unexpected error."
              seoPath="/error"
              seoNoIndex
            />
          </React.Suspense>
        }
      >
        <SnackbarProvider>
          <ErrorFeedbackProvider>
            <QueryClientProvider client={queryClient}>
              <CharacterProvider>
                {/* Load motion features once, lazily, so components use the
                                    lightweight `m` primitives. domMax includes layout
                                    projection (the modifier grids animate layout). */}
                <LazyMotion features={domMax}>{children}</LazyMotion>
              </CharacterProvider>
            </QueryClientProvider>
          </ErrorFeedbackProvider>
        </SnackbarProvider>
      </Sentry.ErrorBoundary>
    </React.StrictMode>
  );
}
