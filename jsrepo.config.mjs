import { defineConfig } from "jsrepo";
import { css, js } from "jsrepo/langs";

export default defineConfig({
  languages: [js(), css()],
  registries: ["https://reactbits.dev/r"],
  paths: {
    component: "src/components/react-bits",
  },
});
