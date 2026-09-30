import { Icon } from "@signa/android/components/ui/icon";
import { Moon, Sun } from "lucide-react-native";
import { Button } from "@signa/android/components/ui/button";
import { useColorScheme } from "nativewind";

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();

  const toggleTheme = () => {
    setColorScheme(colorScheme === "dark" ? "light" : "dark");
  };

  return (
    <Button variant="outline" size="icon" onPress={toggleTheme} className="rounded-full">
      {colorScheme === "dark" ? (
        <Icon as={Sun} size={20} className="text-foreground" />
      ) : (
        <Icon as={Moon} size={20} className="text-foreground" />
      )}
    </Button>
  );
}
