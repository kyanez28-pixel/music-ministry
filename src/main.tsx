import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("No se encontró el elemento #root en el DOM");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// PWA: Registrar Service Worker para permitir la instalación en dispositivos móviles
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.log("Error al registrar el Service Worker:", err);
    });
  });
}
