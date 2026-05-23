import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SubmitToolForm } from "./SubmitToolForm";

/**
 * Server-component shell — auth-gates /submit-tool BEFORE the form
 * renders. Anonymous visitors used to see the form (rendered via
 * useUser()) and only hit 401 on POST; now they bounce to /sign-in
 * with a redirect_url so they land back here after signing in.
 */
export const dynamic = "force-dynamic";

export default async function SubmitToolPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/submit-tool");
  }
  return <SubmitToolForm />;
}
