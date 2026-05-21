/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.avs.io",
        pathname: "/explore/cities/**"
      },
      {
        protocol: "https",
        hostname: "s3.eu-central-1.amazonaws.com",
        pathname: "/static.obilet.com/images/hotel/**"
      }
    ]
  }
};

export default nextConfig;

