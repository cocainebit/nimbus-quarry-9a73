import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/inter";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/jetbrains-mono";
import "@xyflow/react/dist/style.css";
import "@puckeditor/core/puck.css";
import "./site.css";
import "./style.css";
import App from "./App";
import PublishedApp from "./PublishedApp";
import { ResetPassword } from "./AccountForm";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {location.pathname.startsWith("/sites/") ? (
      <PublishedApp />
    ) : location.pathname === "/reset-password" ? (
      <ResetPassword />
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
