import { Button } from "@signa/react-ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@signa/react-ui/components/ui/card";
import {
  Sortable,
  SortableItem,
  SortableItemHandle
} from "@signa/react-ui/components/reui/sortable";
import { GripVertical, Trash2, Edit, Plus } from "lucide-react";
import type { FieldType } from "./field-palette";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  method: "omr" | "ocr";
}

interface FieldListProps {
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
  onEditField: (field: FormField) => void;
  onDeleteField: (fieldId: string) => void;
  onAddField: () => void;
  selectedFieldId?: string;
}

export function FieldList({
  fields,
  onFieldsChange,
  onEditField,
  onDeleteField,
  onAddField,
  selectedFieldId
}: FieldListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm">Danh sách trường</CardTitle>
        <Button onClick={onAddField} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Thêm
        </Button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Chưa có trường nào. Nhấn "Thêm" để tạo trường mới.
          </p>
        ) : (
          <Sortable
            value={fields}
            onValueChange={onFieldsChange}
            getItemValue={(field) => field.id}
            strategy="vertical"
          >
            <div className="space-y-2">
              {fields.map((field) => (
                <SortableItem key={field.id} value={field.id}>
                  <div
                    className={`bg-background flex items-center gap-2 rounded-lg border p-3 ${
                      selectedFieldId === field.id ? "ring-primary ring-2" : ""
                    }`}
                  >
                    <SortableItemHandle>
                      <GripVertical className="text-muted-foreground h-4 w-4" />
                    </SortableItemHandle>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {field.label || "(Chưa có nhãn)"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {field.type} • {field.method.toUpperCase()}
                        {field.required && " • Bắt buộc"}
                      </div>
                    </div>

                    <Button size="icon" variant="ghost" onClick={() => onEditField(field)}>
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button size="icon" variant="ghost" onClick={() => onDeleteField(field.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </SortableItem>
              ))}
            </div>
          </Sortable>
        )}
      </CardContent>
    </Card>
  );
}
