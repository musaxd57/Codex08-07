import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { lixusInboundRunRequestSchema, runLixusInboundAgent } from "@/lib/integrations/lixus-inbound-runner";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = lixusInboundRunRequestSchema.parse(body);
    const result = await runLixusInboundAgent(input);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid Lixus inbound agent request.", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Lixus inbound agent failed."
      },
      { status: 500 }
    );
  }
}
