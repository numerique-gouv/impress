import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ThemeProvider from "@mui/material/styles/ThemeProvider";
import React from "react";
import { theme } from "./theme.ts";

// biome-ignore lint: we know the 'root' element exists.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
