/** @type {import('next').NextConfig} */
const nextConfig = {
  // `build:static` sets this to produce the static export that `deploy:hf`
  // uploads to the Hugging Face Space. It has nothing to do with Firebase --
  // it was called BUILDING_FOR_FIREBASE, which got it mistaken for dead code
  // during the Firebase teardown and removed, silently turning `build:static`
  // into an ordinary server build.
  ...(process.env.BUILDING_STATIC_EXPORT === 'true' ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
  // Turbopack (default for `next dev` on Next 16) infers the workspace root
  // from the nearest lockfile and picks the wrong one -- there's a stray
  // package-lock.json one level up at E:\development. Pin it explicitly so
  // dev doesn't warn or resolve modules against the wrong directory.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
