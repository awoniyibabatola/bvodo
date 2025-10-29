/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: false,
  },
  experimental: {
    forceSwcTransforms: false,
  },
}

module.exports = nextConfig
