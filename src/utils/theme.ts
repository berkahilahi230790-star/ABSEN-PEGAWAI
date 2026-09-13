import { CompanyBranding } from "../types";

export interface ThemeColors {
  gradientBg: string;
  gradientButton: string;
  accentBadge: string;
  glowColor: string;
  subtleBg: string;
  textColor: string;
  borderColor: string;
}

export function getThemeClasses(themePreset: CompanyBranding["themePreset"]): ThemeColors {
  switch (themePreset) {
    case "ocean-cyan":
      return {
        gradientBg: "from-cyan-600 via-sky-600 to-blue-700",
        gradientButton: "from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500",
        accentBadge: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
        glowColor: "rgba(6, 182, 212, 0.25)",
        subtleBg: "bg-cyan-50/60",
        textColor: "text-cyan-700",
        borderColor: "border-cyan-200",
      };
    case "royal-indigo":
      return {
        gradientBg: "from-indigo-700 via-blue-700 to-violet-800",
        gradientButton: "from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500",
        accentBadge: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
        glowColor: "rgba(79, 70, 229, 0.25)",
        subtleBg: "bg-indigo-50/60",
        textColor: "text-indigo-700",
        borderColor: "border-indigo-200",
      };
    case "emerald-fresh":
      return {
        gradientBg: "from-teal-600 via-emerald-600 to-blue-700",
        gradientButton: "from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500",
        accentBadge: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
        glowColor: "rgba(16, 185, 129, 0.25)",
        subtleBg: "bg-emerald-50/60",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
      };
    case "sunset-amber":
      return {
        gradientBg: "from-blue-600 via-indigo-600 to-orange-500",
        gradientButton: "from-blue-600 to-orange-600 hover:from-blue-500 hover:to-orange-500",
        accentBadge: "bg-amber-500/10 text-amber-700 border-amber-200",
        glowColor: "rgba(245, 158, 11, 0.25)",
        subtleBg: "bg-amber-50/60",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
      };
    case "blue-gradient":
    default:
      return {
        gradientBg: "from-blue-700 via-blue-600 to-indigo-700",
        gradientButton: "from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500",
        accentBadge: "bg-blue-500/10 text-blue-700 border-blue-200",
        glowColor: "rgba(37, 99, 235, 0.25)",
        subtleBg: "bg-blue-50/70",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
      };
  }
}
