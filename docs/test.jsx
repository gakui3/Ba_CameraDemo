import React from "react";
import ReactDOM from "react-dom/client";

export const hoge = () => {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<h1>Hello, world!</h1>);
};
