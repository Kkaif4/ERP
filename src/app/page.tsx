import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import HomeClient from "./home-client";

export default async function Home() {
  const session = await getSession();

  if (session) {
    if (session.role === "SUPER_ADMIN") redirect("/admin");
    redirect("/dashboard");
  }

  return <HomeClient />;
}
