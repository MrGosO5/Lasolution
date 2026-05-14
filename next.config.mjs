/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Masque les avertissements Webpack du type PackFileCacheStrategy
    // (« Serializing big strings… ») qui polluent le terminal sans indiquer une erreur.
    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: "error",
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
