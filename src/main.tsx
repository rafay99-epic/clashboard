import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MissingClerkKey } from "@/components/auth/MissingClerkKey";
import { convex } from "@/lib/convex";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/router";
import { clerkAppearance } from "@/lib/clerkAppearance";
import "./index.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const root = createRoot(document.getElementById("root")!);

if (!publishableKey) {
  root.render(
    <StrictMode>
      <MissingClerkKey />
    </StrictMode>,
  );
} else {
  root.render(
    <StrictMode>
      <ClerkProvider
        publishableKey={publishableKey}
        appearance={clerkAppearance}
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
          </QueryClientProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </StrictMode>,
  );
}
