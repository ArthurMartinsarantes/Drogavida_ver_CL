import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import drogaVidaLogo from "@/assets/droga-vida-logo.png";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/");
    });
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 font-body">
      <div
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, var(--color-brand-green), transparent 40%), radial-gradient(circle at 80% 80%, var(--color-brand-blue), transparent 45%)",
        }}
      />
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img
            src={drogaVidaLogo}
            alt="Logo da Droga Vida"
            className="h-16 w-auto object-contain"
          />
          <h1 className="mt-4 font-display font-bold text-2xl tracking-tight">
            Droga Vida
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">
            Sistema Interno
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4"
        >
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/40"
              placeholder="voce@drogavida.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand-green)]/40"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md text-sm font-semibold text-white shadow-md transition-opacity disabled:opacity-60"
            style={{
              background:
                "linear-gradient(135deg, var(--color-brand-green), var(--color-brand-blue))",
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-[11px] text-center text-muted-foreground pt-2">
            Acesso restrito. Solicite credenciais ao administrador.
          </p>
        </form>
      </div>
    </div>
  );
}
