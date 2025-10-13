import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";

export default function Register() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { setSession } = useSession();
  const [, navigate] = useLocation();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t("auth.passwordMismatch", { defaultValue: "As senhas nao coincidem" }),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        accessToken?: string;
        role?: string;
        message?: string;
        displayName?: string | null;
      };

      if (!res.ok) {
        throw new Error(data?.message ?? "Registration failed");
      }

      if (data.accessToken) {
        const role = data.role === "admin" ? "admin" : "user";
        setSession(data.accessToken, role, data.displayName ?? displayName.trim());
        toast({
          title: t("auth.registerSuccess", { defaultValue: "Conta criada com sucesso" }),
          description: t("auth.registerRedirect", { defaultValue: "Bem-vindo(a) a Sociometria" }),
        });
        navigate("/");
        return;
      }

      toast({
        title: t("auth.registerSuccessLogin", { defaultValue: "Conta criada, faca login" }),
        description: t("auth.registerCheckEmail", {
          defaultValue: "Use suas credenciais para acessar a plataforma",
        }),
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: t("auth.registerError", { defaultValue: "Nao foi possivel criar a conta" }),
        description:
          error instanceof Error
            ? error.message
            : t("auth.registerErrorDescription", {
                defaultValue: "Revise os dados informados e tente novamente",
              }),
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
          <CardTitle>{t("auth.registerTitle", { defaultValue: "Criar uma conta" })}</CardTitle>
          <CardDescription>
            {t("auth.registerSubtitle", { defaultValue: "Cadastre seus dados para comecar a usar a plataforma" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">{t("auth.displayName", { defaultValue: "Nome" })}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email", { defaultValue: "E-mail" })}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password", { defaultValue: "Senha" })}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword", { defaultValue: "Confirmar senha" })}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? t("auth.registering", { defaultValue: "Cadastrando..." })
                : t("auth.registerAction", { defaultValue: "Cadastrar" })}
            </Button>
          </form>
          <p className="mt-4 text-sm text-center text-muted-foreground">
            {t("auth.alreadyHaveAccount", { defaultValue: "Ja possui uma conta?" })}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t("auth.loginAction", { defaultValue: "Entrar" })}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
