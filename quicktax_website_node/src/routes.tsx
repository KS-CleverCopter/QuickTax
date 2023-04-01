import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { App } from "./App";
import { Dashboard } from "./pages/dashboard";
import { ProcessedData } from "./pages/processedData";

export const RouterPage = () => (
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/processedData" element={<ProcessedData />} />
  </Routes>
);
