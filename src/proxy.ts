// src/proxy.ts
import { ipAddress } from "@vercel/functions";
import { updateSession } from "./utils/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Fail‑closed 403 response with self‑contained HTML */
function forbiddenResponse(): Response {
  const html = `<!DOCTYPE html><html><head><title>Access Denied</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#111;color:#fff;font-family:sans-serif;"><div style="text-align:center;"><h1 style="font-size:2rem;margin-bottom:0.5rem;">403 – Access Denied</h1><p>Your IP is not authorized.</p></div></div></html>`;
  return new Response(html, {
    status: 403,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/** Parse ALLOWED_IPS env var into a trimmed array */
function getAllowedIps(): string[] {
  const env = process.env.ALLOWED_IPS ?? "";
  return env
    .split(",")
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);
}

export async function proxy(request: NextRequest) {
  // Fail‑closed if env var missing or empty
  const allowedIps = getAllowedIps();
  if (allowedIps.length === 0) {
    return forbiddenResponse();
  }

  // Retrieve client IP using Vercel helper
  const clientIp = ipAddress(request);
  if (!clientIp) {
    return forbiddenResponse();
  }

  // Allow only exact matches
  if (!allowedIps.includes(clientIp)) {
    return forbiddenResponse();
  }

  // IP allowed – execute existing Supabase session logic
  const response = await updateSession(request);
  return response;
}

// Apply to all routes except static assets, images, favicons, and common file extensions
export const config = {
  matcher: ['/:path*'],
};
