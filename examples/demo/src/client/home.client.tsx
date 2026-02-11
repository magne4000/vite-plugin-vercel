import { hydrateRoot } from "react-dom/client";
import { HomePage } from "../pages/HomePage";

const root = document.getElementById("root");
if (root) {
  hydrateRoot(root, <HomePage />);
}
