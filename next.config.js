/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: ['192.168.1.15'],
    output: 'standalone',
    images: {
        remotePatterns: [
            { hostname: 'e7.pngegg.com' },
            { hostname: 'w7.pngwing.com' },
            { hostname: 'lh3.googleusercontent.com' },
            { hostname: 'avatars.githubusercontent.com' },
        ],
    }
}

module.exports = nextConfig
