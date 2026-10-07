import * as React from "react";
import { Button } from "@signa/react-ui/components/ui/button";
import { Input } from "@signa/react-ui/components/ui/input";
import { Label } from "@signa/react-ui/components/ui/label";
import { useAppForm } from "@signa/web/components/form/hooks/use-app-form";
import { z } from "zod";
import { X, Plus } from "lucide-react";
import type { FormField } from "./field-list";

interface FieldPropertiesEditorProps {
  field: FormField | null | undefined;
  onSave: (field: FormField) => void;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  saveCallbackRef?: React.MutableRefObject<(() => void) | null>;
}

const fieldPropertiesSchema = z.object({
  type: z.enum(["checkbox", "radio", "text"]),
  label: z.string().min(1, "Nhãn không được để trống"),
  required: z.boolean(),
  x: z.coerce.number().min(0, "X phải >= 0"),
  y: z.coerce.number().min(0, "Y phải >= 0"),
  width: z.coerce.number().positive("Chiều rộng phải > 0"),
  height: z.coerce.number().positive("Chiều cao phải > 0"),
  method: z.enum(["omr", "ocr"])
});

type FieldPropertiesFormValues = z.input<typeof fieldPropertiesSchema>;

export function FieldPropertiesEditor({
  field,
  onSave,
  onCancel,
  onDirtyChange,
  saveCallbackRef
}: FieldPropertiesEditorProps) {
  const [initialValues, setInitialValues] = React.useState<FieldPropertiesFormValues | null>(null);
  const [options, setOptions] = React.useState<string[]>([]);
  const [initialOptions, setInitialOptions] = React.useState<string[]>([]);

  // Build initial values from field
  const buildInitialValues = (
    currentField: FormField | null | undefined
  ): FieldPropertiesFormValues => ({
    type: currentField?.type || "checkbox",
    label: currentField?.label || "",
    required: currentField?.required || false,
    x: currentField?.position.x || 0,
    y: currentField?.position.y || 0,
    width: currentField?.position.width || 50,
    height: currentField?.position.height || 10,
    method: currentField?.method || "omr"
  });

  const form = useAppForm({
    defaultValues: buildInitialValues(field),
    validators: {
      onSubmit: fieldPropertiesSchema
    },
    onSubmit: async ({ value }) => {
      if (!field) return;

      // Filter out empty options
      const filteredOptions = options.filter((opt) => opt.trim().length > 0);

      // Ensure numeric position values
      const position = {
        x: Number(value.x),
        y: Number(value.y),
        width: Number(value.width),
        height: Number(value.height)
      };

      // Validate all position values are finite
      const positionValues = Object.values(position);
      if (!positionValues.every(Number.isFinite)) {
        console.error("Invalid position values:", position);
        return;
      }

      onSave({
        ...field,
        type: value.type,
        label: value.label,
        required: value.required,
        options: filteredOptions,
        position,
        method: value.method
      });

      // Reset dirty state after successful save
      setInitialValues(value);
      setInitialOptions([...filteredOptions]);
    }
  });

  // Reset form when field changes
  React.useEffect(() => {
    if (field) {
      const newInitialValues = buildInitialValues(field);
      setInitialValues(newInitialValues);
      form.reset(newInitialValues);

      // Initialize options
      const fieldOptions = field.options || [""];
      setOptions(fieldOptions);
      setInitialOptions([...fieldOptions]);
    }
  }, [field?.id]); // Only reset when the field ID changes

  // Track dirty state
  React.useEffect(() => {
    if (!initialValues || !onDirtyChange) return;

    const subscription = form.store.subscribe(() => {
      const currentState = form.store.state;
      const currentValues = currentState.values;

      // Compare current values with initial values including options
      const optionsChanged =
        options.length !== initialOptions.length ||
        options.some((opt, idx) => opt !== initialOptions[idx]);

      const isDirty =
        currentValues.type !== initialValues.type ||
        currentValues.label !== initialValues.label ||
        currentValues.required !== initialValues.required ||
        optionsChanged ||
        Number(currentValues.x) !== Number(initialValues.x) ||
        Number(currentValues.y) !== Number(initialValues.y) ||
        Number(currentValues.width) !== Number(initialValues.width) ||
        Number(currentValues.height) !== Number(initialValues.height) ||
        currentValues.method !== initialValues.method;

      onDirtyChange(isDirty);
    });

    return () => subscription.unsubscribe();
  }, [initialValues, initialOptions, options, onDirtyChange]);

  // Expose save callback
  React.useEffect(() => {
    if (saveCallbackRef) {
      saveCallbackRef.current = () => {
        form.handleSubmit();
      };
    }
  }, [saveCallbackRef, form.handleSubmit]);

  if (!field) {
    return (
      <div className="text-muted-foreground py-4 text-center text-sm">
        Chọn một trường để chỉnh sửa
      </div>
    );
  }

  const [fieldType, setFieldType] = React.useState<"checkbox" | "radio" | "text">("checkbox");

  // Track field type changes
  React.useEffect(() => {
    const subscription = form.store.subscribe(() => {
      const currentState = form.store.state;
      setFieldType(currentState.values.type);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <form.AppForm>
      <form.Form className="space-y-4">
        <form.AppField name="type">
          {(field) => (
            <field.Select
              label="Loại trường"
              description="Checkbox: Có thể chọn nhiều lựa chọn. Radio: Chỉ chọn một lựa chọn."
              options={[
                { label: "Checkbox (chọn nhiều)", value: "checkbox" },
                { label: "Radio (chọn một)", value: "radio" }
              ]}
            />
          )}
        </form.AppField>

        <form.AppField name="label">
          {(field) => <field.Input label="Nhãn" placeholder="Tên trường" />}
        </form.AppField>

        <div className="-space-y-1">
          <form.AppField name="required">
            {(field) => <field.Checkbox layout="inline" label="Bắt buộc" />}
          </form.AppField>
        </div>

        <form.AppField name="method">
          {(field) => (
            <field.Select
              label="Phương thức xử lý"
              options={[
                { label: "OMR (Optical Mark Recognition)", value: "omr" }
                // OCR support coming soon
              ]}
            />
          )}
        </form.AppField>

        {(fieldType === "checkbox" || fieldType === "radio") && (
          <div className="space-y-2">
            <Label>Tùy chọn</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Tùy chọn ${index + 1}`}
                    className="flex-1"
                  />
                  {options.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              className="w-full"
            >
              <Plus className="mr-1 h-4 w-4" />
              Thêm tùy chọn
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Vị trí (mm)</p>
          <div className="grid grid-cols-2 gap-2">
            <form.AppField name="x">{(field) => <field.Input label="X" />}</form.AppField>
            <form.AppField name="y">{(field) => <field.Input label="Y" />}</form.AppField>
            <form.AppField name="width">
              {(field) => <field.Input label="Chiều rộng" />}
            </form.AppField>
            <form.AppField name="height">
              {(field) => <field.Input label="Chiều cao" />}
            </form.AppField>
          </div>
        </div>
      </form.Form>
    </form.AppForm>
  );
}
