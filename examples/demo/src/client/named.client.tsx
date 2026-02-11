import { hydrateRoot } from "react-dom/client";
import { NamedPage } from "../pages/NamedPage";

const root = document.getElementById("root");
if (root) {
  hydrateRoot(root, <NamedPage />);
}
