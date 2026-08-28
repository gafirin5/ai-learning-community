/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable strict linting for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
