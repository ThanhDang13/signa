import * as React from "react";
import { Button } from "@signa/react-ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription
} from "@signa/react-ui/components/ui/sheet";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FieldPropertiesEditor } from "./field-properties-editor";
import type { FormField } from "./field-list";

interface FieldPropertiesSheetProps {
  field: FormField | null | undefined;
  fieldIndex: number;
  totalFields: number;
  onSave: (field: FormField) => void;
  onSaveAndNext: (field: FormField) => void;
  onSaveFromDialog: (field: FormField) => void;
  onClose: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
}

export const FieldPropertiesSheet = React.forwardRef<
  { triggerSave: () => void },
  FieldPropertiesSheetProps
>(function FieldPropertiesSheet(
  {
    field,
    fieldIndex,
    totalFields,
    onSave,
    onSaveAndNext,
    onSaveFromDialog,
    onClose,
    onDirtyChange,
    onNavigatePrevious,
    onNavigateNext
  },
  ref
) {
  const saveCallbackRef = React.useRef<(() => void) | null>(null);
  const [pendingSaveAction, setPendingSaveAction] = React.useState<
    "save" | "saveAndNext" | "saveFromDialog" | null
  >(null);

  const handleSaveComplete = (savedField: FormField) => {
    if (pendingSaveAction === "saveAndNext") {
      onSaveAndNext(savedField);
    } else if (pendingSaveAction === "saveFromDialog") {
      onSaveFromDialog(savedField);
    } else {
      onSave(savedField);
    }
    setPendingSaveAction(null);
  };

  const handleSaveClick = () => {
    setPendingSaveAction("save");
    saveCallbackRef.current?.();
  };

  const handleSaveAndNextClick = () => {
    setPendingSaveAction("saveAndNext");
    saveCallbackRef.current?.();
  };

  // Expose save method for dialog
  React.useImperativeHandle(ref, () => ({
    triggerSave: () => {
      setPendingSaveAction("saveFromDialog");
      saveCallbackRef.current?.();
    }
  }));

  const canNavigatePrevious = fieldIndex > 0;
  const canNavigateNext = fieldIndex >= 0 && fieldIndex < totalFields - 1;

  return (
    <Sheet open={field !== null && field !== undefined} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
        {field && (
          <>
            <SheetHeader className="px-6 py-4 border-b">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <SheetTitle>Chỉnh sửa trường</SheetTitle>
                  <SheetDescription className="mt-1">
                    {field.label || "Trường chưa đặt tên"}
                  </SheetDescription>
                </div>
                {totalFields > 1 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onNavigatePrevious}
                      disabled={!canNavigatePrevious}
                      aria-label="Trường trước"
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[4rem] text-center">
                      {fieldIndex + 1} / {totalFields}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onNavigateNext}
                      disabled={!canNavigateNext}
                      aria-label="Trường tiếp theo"
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <FieldPropertiesEditor
                field={field}
                onSave={handleSaveComplete}
                onCancel={onClose}
                onDirtyChange={onDirtyChange}
                saveCallbackRef={saveCallbackRef}
              />
            </div>

            <SheetFooter className="px-6 py-4 border-t gap-2 sm:gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">
                Hủy
              </Button>
              <div className="flex gap-2 flex-1 sm:flex-initial">
                <Button onClick={handleSaveClick} className="flex-1 sm:flex-initial">
                  Lưu
                </Button>
                {canNavigateNext && (
                  <Button onClick={handleSaveAndNextClick} className="flex-1 sm:flex-initial">
                    Lưu & tiếp theo
                  </Button>
                )}
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
});
