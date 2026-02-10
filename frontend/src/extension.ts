import { renderApp } from "./app";

export default {
  onExtensionPageLoad() {
    const container = document.getElementById("favaGitApp");
    if (!container) return;
    renderApp(container);
  },
};
