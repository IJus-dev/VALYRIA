const repoName = "VALYRIA";


/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}`,
  transpilePackages: ["@valyria/i18n"],
  env: {
    NEXT_PUBLIC_BASE_PATH: `/${repoName}`,
  },
};

export default nextConfig;
