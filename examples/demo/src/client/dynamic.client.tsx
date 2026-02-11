import { hydrateRoot } from "react-dom/client";
import { DynamicPage } from "../pages/DynamicPage";

const root = document.getElementById("root");
if (root) {
  hydrateRoot(root, <DynamicPage />);
}
