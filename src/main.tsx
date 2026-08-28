import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PresenceProvider } from "@/context/PresenceContext";
import { NotificationsProvider } from "@/context/NotificationsContext";

const basename = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <PresenceProvider>
          <NotificationsProvider>
            <App />
          </NotificationsProvider>
        </PresenceProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);