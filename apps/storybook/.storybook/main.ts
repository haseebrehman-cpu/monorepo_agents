import type { StorybookConfig } from "@storybook/react-vite";

type PluginLike = { name?: string } | false | null | undefined | PluginLike[];

// Vite 8's React refresh wrapper rejects Storybook's iframe bootstrap
// (`Missing field moduleType`) and leaves every story on the loading spinner.
function stripReactRefreshWrapper(plugins: PluginLike[] | undefined): PluginLike[] {
  if (!plugins) return [];

  const next: PluginLike[] = [];
  for (const plugin of plugins) {
    if (!plugin) continue;
    if (Array.isArray(plugin)) {
      next.push(stripReactRefreshWrapper(plugin));
      continue;
    }
    if (typeof plugin === "object" && plugin.name === "vite:react:refresh-wrapper") {
      continue;
    }
    next.push(plugin);
  }
  return next;
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: "@storybook/react-vite",
  async viteFinal(viteConfig) {
    viteConfig.plugins = stripReactRefreshWrapper(
      viteConfig.plugins as PluginLike[] | undefined,
    ) as typeof viteConfig.plugins;
    return viteConfig;
  },
};

export default config;
