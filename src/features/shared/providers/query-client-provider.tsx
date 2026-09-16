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
  // Without storage (server render) this is a no-op persister, so SSR still renders the tree.
  return createSyncStoragePersister({
    storage: typeof window === "undefined" ? undefined : window.localStorage,
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

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24h
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
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
