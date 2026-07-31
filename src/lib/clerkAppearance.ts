export const clerkAppearance = {
  variables: {
    colorPrimary: "#e0a531",
    colorBackground: "#191510",
    colorText: "#f3eee4",
    colorTextSecondary: "#9b9184",
    colorInputBackground: "#100e0b",
    colorInputText: "#f3eee4",
    colorDanger: "#c9503e",
    colorSuccess: "#82ab45",
    borderRadius: "0.625rem",
    fontFamily: "inherit",
  },
  elements: {
    card: "border border-[#2a231c] shadow-none",
    headerTitle: "tracking-tight",
    socialButtonsBlockButton: "border-[#2a231c]",
    formButtonPrimary:
      "bg-[#e0a531] text-[#171104] hover:bg-[#e0a531]/90 normal-case font-medium",
    footerActionLink: "text-[#e0a531] hover:text-[#e0a531]",
  },
} as const;
