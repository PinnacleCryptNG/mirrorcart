import { NextRequest, NextResponse } from "next/server";
import { checkPass, dashToken, DASH_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const url = new URL("/dashboard", req.url);
  if (form.get("logout")) {
    const res = NextResponse.redirect(url, 303);
    res.cookies.delete(DASH_COOKIE);
    return res;
  }
  if (!checkPass(String(form.get("pass") || ""))) {
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, 303);
  }
  const res = NextResponse.redirect(url, 303);
  res.cookies.set(DASH_COOKIE, dashToken(), { httpOnly: true, sameSite: "lax", secure: req.nextUrl.protocol === "https:", path: "/", maxAge: 7 * 86400 });
  return res;
}
