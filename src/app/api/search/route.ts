import Exa from "exa-js";
import { NextRequest, NextResponse } from "next/server";

const exa = new Exa(process.env.EXA_API_KEY!);

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  const results = await exa.search(query, {
    type: "auto",
    numResults: 8,
    contents: { highlights: true },
    includeDomains: [
      "sam.gov",
      "grants.gov",
      "usaspending.gov",
      "fpds.gov",
      "acquisition.gov",
    ],
  });

  return NextResponse.json(results);
}
