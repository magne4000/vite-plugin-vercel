import { hydrateRoot } from "react-dom/client";
import { CatchAllPage } from "../pages/CatchAllPage";

const root = document.getElementById("root");
if (root) {
  hydrateRoot(root, <CatchAllPage />);
}
