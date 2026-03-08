/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@wealthwise/shared-types"],
  output: "standalone",
  poweredByHeader: false,
};

module.exports = nextConfig;
