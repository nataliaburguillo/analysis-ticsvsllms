/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === "production" ? "/analysis-ticsvsllms" : "",
  assetPrefix:
    process.env.NODE_ENV === "production" ? "/analysis-ticsvsllms" : "",
};

module.exports = nextConfig;
