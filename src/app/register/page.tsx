import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "2.5rem 1.5rem",
      }}
    >
      {/* Ambient Background Glows */}
      <div
        style={{
          position: "absolute",
          top: "-150px",
          right: "-100px",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(ellipse at center, rgba(21,128,61,0.06) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          left: "-100px",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(ellipse at center, rgba(21,128,61,0.04) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />

      <RegisterForm />
    </main>
  );
}
