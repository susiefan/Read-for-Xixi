import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import OpenReader from "../app/OpenReader";

const root = document.getElementById("root");
if (!root) throw new Error("Missing reading app root");
createRoot(root).render(<StrictMode><OpenReader /></StrictMode>);
