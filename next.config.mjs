import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias["next-auth/react"] = path.resolve(
      __dirname,
      "node_modules/next-auth/react/index.js"
    )
    config.resolve.alias["next-auth/next"] = path.resolve(
      __dirname,
      "node_modules/next-auth/next/index.js"
    )
    return config
  },
}

export default nextConfig;
