import { NextResponse } from "next/server";
import { createLixusAgentReadinessReport } from "@/lib/integrations/readiness-check";

export async function GET() {
  return NextResponse.json(
    createLixusAgentReadinessReport({
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
        LITELLM_BASE_URL: process.env.LITELLM_BASE_URL
      },
      mode: "dry_run"
    })
  );
}
