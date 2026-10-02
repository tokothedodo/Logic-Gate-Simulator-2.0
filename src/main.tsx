import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/* macOS WKWebView has no switch for its native Reload / Inspect menu, so the
   DOM contextmenu event is blocked instead. capture is required because the
   right click lands on the canvas <div> rather than <body>. Our own menu is
   rendered from React and stays reachable. */
document.addEventListener(
  "contextmenu",
  (event) => {
    event.preventDefault();
  },
  { capture: true }
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);