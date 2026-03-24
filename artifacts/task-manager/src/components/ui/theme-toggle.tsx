import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const icon =
    resolvedTheme === "dark" ? (
      <Moon className="w-4 h-4" />
    ) : (
      <Sun className="w-4 h-4" />
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          compact
            ? "p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 light:text-black/50 light:hover:text-black/80 light:hover:bg-black/8 transition-all focus:outline-none"
            : "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all focus:outline-none text-white/60 hover:text-white hover:bg-white/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
        }
        title="Toggle theme"
      >
        {icon}
        {!compact && <span className="hidden sm:block">Theme</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 rounded-xl dark:bg-gray-900/90 dark:backdrop-blur-md dark:border-white/10 bg-white/95 backdrop-blur-md border-black/10 shadow-xl"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`cursor-pointer flex items-center gap-2 dark:text-white/80 dark:hover:text-white dark:focus:bg-white/5 text-gray-700 hover:text-gray-900 focus:bg-gray-100 ${theme === "light" ? "dark:text-green-400 text-green-600 font-medium" : ""}`}
        >
          <Sun className="w-4 h-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`cursor-pointer flex items-center gap-2 dark:text-white/80 dark:hover:text-white dark:focus:bg-white/5 text-gray-700 hover:text-gray-900 focus:bg-gray-100 ${theme === "dark" ? "dark:text-green-400 text-green-600 font-medium" : ""}`}
        >
          <Moon className="w-4 h-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`cursor-pointer flex items-center gap-2 dark:text-white/80 dark:hover:text-white dark:focus:bg-white/5 text-gray-700 hover:text-gray-900 focus:bg-gray-100 ${theme === "system" ? "dark:text-green-400 text-green-600 font-medium" : ""}`}
        >
          <Monitor className="w-4 h-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
