/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'portal.opentopography.org',
                port: '',
                pathname: '/API/globaldem/**',
            },
        ],
    },
    async headers() {
        return [
            {
                // matching all API routes
                source: "/:path*",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "false" },
                    { key: "Access-Control-Allow-Origin", value: "https://storage.googleapis.com" },
                    { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
                    { key: "Access-Control-Allow-Headers", value: "Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date" },
                ]
            }
        ]
    }
}

module.exports = nextConfig
