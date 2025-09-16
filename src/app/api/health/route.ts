import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { EnvWithHyperdrive } from "@/server/db";
import { runQuery } from "@/server/db";

export async function GET(req: NextRequest) {
  console.log("[HEALTH] Health check started");
  
  const healthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    checks: {
      cloudflare_context: false,
      hyperdrive_binding: false,
      database_connection: false,
      environment_variables: false,
    },
    details: {} as any,
    errors: [] as string[],
  };

  try {
    // 检查 Cloudflare 上下文
    console.log("[HEALTH] Checking Cloudflare context");
    const { env } = getCloudflareContext();
    healthStatus.checks.cloudflare_context = true;
    console.log("[HEALTH] Cloudflare context OK");

    // 检查 HYPERDRIVE 绑定
    console.log("[HEALTH] Checking HYPERDRIVE binding");
    if (env && (env as any).HYPERDRIVE) {
      healthStatus.checks.hyperdrive_binding = true;
      healthStatus.details.hyperdrive = {
        connectionString: (env as any).HYPERDRIVE.connectionString ? "configured" : "missing",
      };
      console.log("[HEALTH] HYPERDRIVE binding OK");
    } else {
      healthStatus.errors.push("HYPERDRIVE binding not found");
      console.error("[HEALTH] HYPERDRIVE binding FAILED");
    }

    // 检查环境变量
    console.log("[HEALTH] Checking environment variables");
    healthStatus.details.environment = {
      SECRET_COOKIE_PASSWORD: (env as any)?.SECRET_COOKIE_PASSWORD ? "configured" : "missing",
      R2_PUBLIC_BASE: (env as any)?.R2_PUBLIC_BASE ? "configured" : "missing",
      R2: (env as any)?.R2 ? "configured" : "missing",
    };
    
    if ((env as any)?.SECRET_COOKIE_PASSWORD) {
      healthStatus.checks.environment_variables = true;
      console.log("[HEALTH] Environment variables OK");
    } else {
      healthStatus.errors.push("Required environment variables missing");
      console.error("[HEALTH] Environment variables FAILED");
    }

    // 检查数据库连接
    console.log("[HEALTH] Checking database connection");
    if (healthStatus.checks.hyperdrive_binding) {
      try {
        const result = await runQuery(env as EnvWithHyperdrive, "SELECT 1 as test_connection");
        healthStatus.checks.database_connection = true;
        healthStatus.details.database = {
          connection: "ok",
          test_query: result.rows.length > 0 ? "success" : "failed",
        };
        console.log("[HEALTH] Database connection OK");
      } catch (dbError) {
        healthStatus.errors.push(`Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        healthStatus.details.database = {
          connection: "failed",
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
        };
        console.error("[HEALTH] Database connection FAILED:", dbError);
      }
    }

    // 总体状态检查
    const allChecksPass = Object.values(healthStatus.checks).every(check => check === true);
    if (!allChecksPass) {
      healthStatus.status = "degraded";
    }

    console.log("[HEALTH] Health check completed:", healthStatus.status);

    return NextResponse.json(healthStatus, {
      status: healthStatus.status === "ok" ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error("[HEALTH] Health check error:", error);
    
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
