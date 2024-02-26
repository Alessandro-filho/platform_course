import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { useTheme } from "../../utils/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {theme === "light" ? (
        <Sun className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all" />
      ) : (
        <Moon className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all" />
      )}
    </Button>
  );
}
