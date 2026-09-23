// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { theme } from "./theme";
import { store } from "./redux/store";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastProvider from "./components/ToastProvider";
import ToastNotification from "./components/ToastNotification";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {/* ✅ FIX: LocalizationProvider for MUI DatePicker (v7+ uses AdapterDateFnsV3) */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <App />
              {/* ✅ Toast providers — yahan mount karo */}
              <ToastProvider />
              <ToastNotification />
            </BrowserRouter>
          </LocalizationProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);