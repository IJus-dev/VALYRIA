import { prisma } from "@valyria/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { issueOtpCode } from "@/lib/otp";

const requestOtpSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).optional()
});

export async function POST(request: Request) {
  const body = requestOtpSchema.parse(await request.json());
  const result = await issueOtpCode(body.email);

  await prisma.user.upsert({
    where: { email: body.email },
    update: {
      ...(body.name ? { name: body.name } : {}),
      updatedAt: new Date()
    },
    create: {
      email: body.email,
      ...(body.name ? { name: body.name } : {}),
      state: "registered",
      roles: []
    }
  });

  return NextResponse.json(result, {
    status: 201
  });
}
