import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Uncomment to enable R2 cache,
  // It should be imported as:
  // `import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";`
  // See https://opennext.js.org/cloudflare/caching for more details
  // incrementalCache: r2IncrementalCache,
  
  // 确保API路由正确处理
  experimental: {
    // 启用更好的API路由支持
    streamingRenderer: true,
  },
  
  // 配置运行时兼容性
  override: {
    wrapper: "cloudflare-edge",
    converter: "edge",
    incrementalCache: "dummy",
  },
});
