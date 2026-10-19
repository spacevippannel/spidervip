const nextConfig = {
  allowedDevOrigins: [
    "10.220.15.131",
    "10.220.15.131:3000",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
