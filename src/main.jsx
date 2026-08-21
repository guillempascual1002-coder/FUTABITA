import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar el service worker para que funcione offline / como app instalada.
// Si mientras la app está abierta se activa un service worker nuevo (tras un
// deploy), recargamos una sola vez para no quedarnos ejecutando en memoria el
// JS viejo mientras el resto del sitio (imágenes, etc.) ya es el nuevo.
if ("serviceWorker" in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
