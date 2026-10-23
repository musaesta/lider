import type { NextConfig } from "next";

function supabaseImageHost() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!url) {
    return null;
  }

  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function isLocalSupabaseHost(parsed: URL | null) {
  if (!parsed) {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  return host === "127.0.0.1" || host === "localhost";
}

function supabaseImagePattern() {
  const parsed = supabaseImageHost();

  if (!parsed) {
    return [];
  }

  const protocol = parsed.protocol === "https:" ? "https" : "http";

  return [
    {
      protocol,
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
      pathname: "/storage/v1/object/public/**",
    } as const,
  ];
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    qualities: [75],
    minimumCacheTTL: 86400,
    dangerouslyAllowLocalIP: isLocalSupabaseHost(supabaseImageHost()),
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      ...supabaseImagePattern(),
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
