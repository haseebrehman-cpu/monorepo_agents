import type { Preview } from "@storybook/react-vite";
import "@rdx/ui/styles.css";
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
