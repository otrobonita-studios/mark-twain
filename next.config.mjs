/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  ...(process.env.BUILDING_FOR_FIREBASE === 'true' ? { output: 'export' } : {}),
};

export default nextConfig;
