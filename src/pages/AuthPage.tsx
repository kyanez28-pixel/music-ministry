import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [session, navigate, location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("¡Bienvenido de nuevo!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error?.message || "Ocurrió un error inesperado al iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("¡Cuenta creada exitosamente! Por favor revisa tu correo.");
      }
    } catch (error: any) {
      toast.error(error?.message || "Ocurrió un error inesperado al crear cuenta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container relative flex-col items-center justify-center min-h-screen grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background text-foreground">
      {/* Decorative Left Side */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-primary/90" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Music className="mr-2 h-6 w-6" />
          Ministerio de Música
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Organiza tu repertorio, métricas y progresión musical en un solo lugar. 
              Diseñado para ministerios de adoración."
            </p>
          </blockquote>
        </div>
      </div>

      {/* Auth Forms */}
      <div className="p-4 lg:p-8 h-full flex items-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Ingreso a la Plataforma
            </h1>
            <p className="text-sm text-muted-foreground">
              Ingresa tu correo abajo para entrar a tu cuenta.
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registro</TabsTrigger>
            </TabsList>
            
            {/* INICIAR SESION TAB */}
            <TabsContent value="login">
              <Card>
                <form onSubmit={handleSignIn}>
                  <CardHeader>
                    <CardTitle>Iniciar Sesión</CardTitle>
                    <CardDescription>
                      Ingresa tus credenciales para acceder a tu repertorio.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-login">Correo electrónico</Label>
                      <Input
                        id="email-login"
                        type="email"
                        placeholder="musico@iglesia.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-login">Contraseña</Label>
                      <Input
                        id="password-login"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Cargando..." : "Entrar"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* REGISTRO TAB */}
            <TabsContent value="register">
              <Card>
                <form onSubmit={handleSignUp}>
                  <CardHeader>
                    <CardTitle>Crea una cuenta</CardTitle>
                    <CardDescription>
                      Introduce tus datos para comenzar a organizar tu música.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-register">Correo electrónico</Label>
                      <Input
                        id="email-register"
                        type="email"
                        placeholder="musico@iglesia.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-register">Contraseña</Label>
                      <Input
                        id="password-register"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Cargando..." : "Registrarme"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
