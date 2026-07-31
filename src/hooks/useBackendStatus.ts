import { useEffect, useState } from "react";
import { useConvex } from "convex/react";

export function useBackendOnline(): boolean {
  const convex = useConvex();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const check = () =>
      setOnline(convex.connectionState().isWebSocketConnected);
    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, [convex]);

  return online;
}
