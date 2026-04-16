/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [
            { hostname: 'e7.pngegg.com' },
            { hostname: 'w7.pngwing.com' },
        ],
    }
}

module.exports = nextConfig
