const repoName = "VALYRIA";


/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}`,
  transpilePackages: ["@valyria/i18n"],
};

export default nextConfig;
