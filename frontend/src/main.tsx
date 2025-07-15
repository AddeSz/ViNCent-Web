import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@/global.css";
import App from "@/App.tsx";
import { ThemeProvider } from "@/components/shadcnUI/theme-provider";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </BrowserRouter>,
);
