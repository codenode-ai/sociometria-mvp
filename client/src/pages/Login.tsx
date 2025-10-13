import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";

export default function Login() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { setSession } = useSession();
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        throw new Error("invalid");
      }
      const data = (await res.json()) as { accessToken: string; role?: string };
      const role = data.role === "admin" ? "admin" : "user";
      setSession(data.accessToken, role);
      toast({
        title: t("auth.loginSuccess", { defaultValue: "Bem-vindo" }),
      });
      navigate("/");
    } catch (error) {
      toast({
        title: t("auth.loginError", { defaultValue: "Nao foi possivel entrar" }),
        description: t("auth.loginErrorDescription", { defaultValue: "Verifique suas credenciais" }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.loginTitle", { defaultValue: "Acessar Sociometria" })}</CardTitle>
          <CardDescription>
            {t("auth.loginSubtitle", { defaultValue: "Informe suas credenciais para continuar" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email", { defaultValue: "E-mail" })}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password", { defaultValue: "Senha" })}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? t("auth.loggingIn", { defaultValue: "Entrando..." })
                : t("auth.loginAction", { defaultValue: "Entrar" })}
            </Button>
          </form>
          <p className="mt-4 text-sm text-center text-muted-foreground">
            {t("auth.noAccountQuestion", { defaultValue: "Ainda nao tem conta?" })}{" "}
            <Link href="/cadastro" className="text-primary hover:underline">
              {t("auth.registerAction", { defaultValue: "Cadastre-se" })}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
