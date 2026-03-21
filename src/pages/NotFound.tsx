import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404: Ruta no encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 px-4">
        <p className="text-6xl">♪</p>
        <h1 className="text-4xl font-bold font-display text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Página no encontrada</p>
        <p className="text-sm text-muted-foreground font-mono">{location.pathname}</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Ir al Dashboard →
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
