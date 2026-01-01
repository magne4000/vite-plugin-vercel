import { hydrateRoot } from "react-dom/client";
import { IsrPage } from "../pages/IsrPage";

const root = document.getElementById("root");
if (root) {
  hydrateRoot(root, <IsrPage isr={15} />);
}
