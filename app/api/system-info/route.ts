import { NextResponse } from "next/server"

export async function GET() {
  // Check if MYSQL_URL environment variable is set to determine database presence
  const hasDatabase = !!process.env.MYSQL_URL
  const version = "1.0.0" // You can update this version as needed

  return NextResponse.json({ hasDatabase, version })
}
