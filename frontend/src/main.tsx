import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import "./styles/subwindow.css";
import { initProductionDiagnostics } from "./lib/productionDiagnostics";
import { installMonacoCancellationHandlers } from "./lib/monacoCancellation";
import { Bootstrap } from "./Bootstrap";

installMonacoCancellationHandlers();
initProductionDiagnostics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
