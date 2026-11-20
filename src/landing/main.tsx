import { createRoot } from "react-dom/client";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/600.css";
import "../index.css";
import Landing from "./Landing";

createRoot(document.getElementById("root")!).render(<Landing />);
