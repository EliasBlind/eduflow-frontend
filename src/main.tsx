import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRouter } from "@/router";
import { initTokenScheduler } from "./services/token/token-scheduler";
import "./i18n";                 // ← инициализация мультиязычности
import "./theme/theme.css";
import { ThemeProvider } from "./theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

initTokenScheduler();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element with id 'root' not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);

