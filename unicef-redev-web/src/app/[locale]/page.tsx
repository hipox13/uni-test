import { redirect } from "next/navigation";

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  await params; // satisfy Next.js 15 params Promise
  redirect("/");
}
