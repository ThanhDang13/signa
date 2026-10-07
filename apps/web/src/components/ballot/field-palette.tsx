import { Button } from "@signa/react-ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@signa/react-ui/components/ui/card";
import { CheckSquare, Circle, Type } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

export type FieldType = "checkbox" | "radio" | "text";

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

const fieldTypes: Array<{ type: FieldType; label: string; icon: ReactNode }> = [
  { type: "checkbox", label: "Checkbox", icon: <CheckSquare className="h-4 w-4" /> },
  { type: "radio", label: "Radio", icon: <Circle className="h-4 w-4" /> }
  // Text field support coming soon
];

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Loại trường</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {fieldTypes.map(({ type, label, icon }) => (
          <Button
            key={type}
            variant="outline"
            className="w-full justify-start"
            onClick={() => onAddField(type)}
          >
            {icon}
            <span className="ml-2">{label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
