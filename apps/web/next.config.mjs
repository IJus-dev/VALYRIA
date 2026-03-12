/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: ["@valyria/domain", "@valyria/xrpl", "@valyria/i18n"]
};

export default nextConfig;
