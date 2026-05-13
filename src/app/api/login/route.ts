import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const COOKIE = "erp_session";
const ADMIN_EMAIL = "admin@angradrywall.com";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (!user) return NextResponse.json({ error: "Inválido" }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        id: crypto.randomBytes(16).toString("hex"),
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      expires: expiresAt,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[login] error:", message);
    return NextResponse.json({ error: "Erro interno", detail: message }, { status: 500 });
  }
}
