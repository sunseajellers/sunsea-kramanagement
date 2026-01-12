/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: [],
    },
    // TypeScript configuration
    typescript: {
        // Don't fail build on type errors (we'll check separately)
        ignoreBuildErrors: false,
    },
}

module.exports = nextConfig
