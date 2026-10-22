import { getSupabaseConfig, SupabaseConfigError } from "@/lib/supabase/config";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }

  let config;

  try {
    config = getSupabaseConfig();
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return Response.json(
        {
          configuration: "incomplete",
          network: "not_checked",
          dataAccess: "not_checked",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    throw error;
  }

  if (!config) {
    return Response.json(
      {
        configuration: "missing",
        network: "not_checked",
        dataAccess: "not_checked",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let healthUrl: URL;

  try {
    healthUrl = new URL("/auth/v1/health", config.url);
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }

    return Response.json(
      {
        configuration: "invalid",
        network: "not_checked",
        dataAccess: "not_checked",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (healthUrl.protocol !== "https:" && healthUrl.protocol !== "http:") {
    return Response.json(
      {
        configuration: "invalid",
        network: "not_checked",
        dataAccess: "not_checked",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let response: Response;

  try {
    response = await fetch(healthUrl, {
      cache: "no-store",
      headers: { apikey: config.publishableKey },
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return Response.json(
        {
          configuration: "configured",
          network: "timed_out",
          dataAccess: "not_checked",
        },
        { status: 504, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (error instanceof TypeError) {
      return Response.json(
        {
          configuration: "configured",
          network: "unreachable",
          dataAccess: "not_checked",
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    throw error;
  }

  return Response.json(
    {
      configuration: "configured",
      network: {
        status: "responded",
        health: response.ok ? "healthy" : "unhealthy",
        httpStatus: response.status,
      },
      dataAccess: "not_checked",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
