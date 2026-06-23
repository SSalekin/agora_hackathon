// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import * as anchor from "@anchor-lang/core";
import type { Provider } from "@anchor-lang/core";

export default async (provider: Provider) => {
  anchor.setProvider(provider);
};
