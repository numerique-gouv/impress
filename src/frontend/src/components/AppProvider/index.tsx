import {QueryClientProvider} from "@tanstack/react-query";
import {CunninghamProvider} from "@openfun/cunningham-react";
import {queryClient} from "../../lib";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";

export type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({children}: AppProviderProps) => (
  <QueryClientProvider client={queryClient}>
    <CunninghamProvider>
      {children}
      <ReactQueryDevtools initialIsOpen />
    </CunninghamProvider>
  </QueryClientProvider>
)
