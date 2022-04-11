import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { Wrapper } from "@googlemaps/react-wrapper";

ReactDOM.render(
  <React.StrictMode>
    <Wrapper
      apiKey={import.meta.env.VITE_GOOGLE_MAP_API_STAGING_KEY}
      libraries={["places"]}
    >
      <App />
    </Wrapper>
  </React.StrictMode>,
  document.getElementById("root")
);
