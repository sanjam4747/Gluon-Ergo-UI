import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["gluon-ergo-sdk"],

  // Prevent Next.js from bundling the Node.js WASM package server-side.
  // When bundled, webpack copies the .wasm to a chunk path that doesn't
  // exist at Vercel runtime. Marking it external makes Node require() it
  // directly from node_modules, where the .wasm sits beside the .js glue.
  serverExternalPackages: ["ergo-lib-wasm-nodejs"],

  // Ensure the .wasm binary is included in Vercel's output file tracing.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/ergo-lib-wasm-nodejs/**/*.wasm"],
  },

  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    // Production CSP notes:
    // - 'unsafe-eval' is removed in production (only needed by Next.js dev HMR).
    // - 'unsafe-inline' is retained because the Next.js Pages Router injects
    //   inline scripts during SSR that cannot be nonce-tagged without wiring
    //   a custom middleware + _document propagation. A full nonce-based CSP
    //   is architecturally feasible but is a separate, broader change.
    // - 'wasm-unsafe-eval' is required by ergo-lib-wasm-browser.
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval';"
      : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';";

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `${scriptSrc} object-src 'none'; base-uri 'self';`,
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // asyncWebAssembly is required for ergo-lib-wasm-browser dynamic imports.
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // The ['web', 'es2020'] client target is deliberately kept here.
    // ergo-lib-wasm-browser emits async/await in its WASM glue code; without
    // an ES2020 target webpack cannot confirm the runtime supports async/await
    // and emits a warning that degrades to a real runtime failure in some
    // environments. The server bundle target is left to Next.js defaults.
    if (!isServer) {
      config.target = ["web", "es2020"];
    }

    return config;
  },
};

export default nextConfig;
