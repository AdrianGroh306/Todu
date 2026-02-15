"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { ReactNode, useState } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24, // 24h
      },
    },
  });
}

function makePersister() {
  if (typeof window === "undefined") return undefined;
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: "todu-query-cache",
  });
}

export const QueryClientProviderWrapper = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [client] = useState(() => makeQueryClient());
  const [persister] = useState(() => makePersister());

  if (!persister) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24h
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Don't persist presence queries
            const key = query.queryKey[0];
            if (key === "presence" || key === "profile") return false;
            return query.state.status === "success";
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
