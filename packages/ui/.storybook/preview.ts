import type { Preview } from "@storybook/react"
import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
import "../src/styles.css"

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "hsl(0 0% 100%)" },
        { name: "dark", value: "hsl(0 0% 3.9%)" },
        { name: "muted", value: "hsl(0 0% 96.1%)" },
      ],
    },
  },
}

export default preview
