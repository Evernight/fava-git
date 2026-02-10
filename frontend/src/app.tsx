import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { CssBaseline } from "@mui/material";
import { CustomThemeProvider } from "./theme";
import { GitDashboard } from "./components/GitDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export function renderApp(container: Element) {
  const root = createRoot(container);
  root.render(
    <QueryClientProvider client={queryClient}>
      <CustomThemeProvider>
        <CssBaseline />
        <GitDashboard />
      </CustomThemeProvider>
    </QueryClientProvider>,
  );
}
