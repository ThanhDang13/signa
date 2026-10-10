import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as React from "react";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@signa/react-ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@signa/react-ui/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink
} from "@signa/react-ui/components/ui/breadcrumb";
import { Separator } from "@signa/react-ui/components/ui/separator";
import { SidebarTrigger } from "@signa/react-ui/components/ui/sidebar";
import { ScrollArea } from "@signa/react-ui/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@signa/react-ui/components/ui/dialog";
import { FieldList, type FormField } from "@signa/web/components/ballot/field-list";
import { FieldPropertiesSheet } from "@signa/web/components/ballot/field-properties-sheet";
import { electionQueries, electionMutations } from "@signa/web/lib/tanstack/options/election";
import { ballotMutations } from "@signa/web/lib/tanstack/options/ballot";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/elections/$id/builder")({
  component: RouteComponent
});

type DiscardAction = "switch" | "close";

function RouteComponent() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [fields, setFields] = React.useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>(undefined);
  const [isEditorDirty, setIsEditorDirty] = React.useState(false);
  const [pendingFieldId, setPendingFieldId] = React.useState<string | undefined>(undefined);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = React.useState(false);
  const [discardAction, setDiscardAction] = React.useState<DiscardAction>("switch");
  const sheetRef = React.useRef<{ triggerSave: () => void }>(null);

  const { data: election } = useQuery(
    electionQueries.detail({
      params: { id }
    })
  );

  const updateMutation = useMutation(electionMutations.update());
  const previewMutation = useMutation(ballotMutations.preview());

  // Derive selected field from fields list
  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? null;

  // Initialize fields from election formStructure
  React.useEffect(() => {
    if (election?.formStructure?.fields) {
      setFields(election.formStructure.fields as FormField[]);
    }
  }, [election]);

  // Build normalized form structure for API/preview
  const buildFormStructure = () => ({
    title: election?.title || "",
    description: election?.description,
    fields: fields.map((field) => ({
      id: field.id,
      type: field.type,
      method: field.method,
      label: field.label,
      required: field.required,
      options: field.options,
      position: {
        x: Number(field.position.x),
        y: Number(field.position.y),
        width: Number(field.position.width),
        height: Number(field.position.height)
      }
    })),
    layout: election?.formStructure?.layout || {
      pageWidth: 210,
      pageHeight: 297,
      margins: { top: 20, right: 20, bottom: 20, left: 20 }
    }
  });

  const handleAddField = () => {
    const newField: FormField = {
      id: uuidv4(),
      type: "checkbox",
      label: "Trường mới",
      required: false,
      options: ["Tùy chọn 1"],
      position: {
        x: 20,
        y: 20 + fields.length * 30,
        width: 50,
        height: 10
      },
      method: "omr"
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const requestEditField = (field: FormField) => {
    if (isEditorDirty && selectedFieldId !== field.id) {
      setPendingFieldId(field.id);
      setDiscardAction("switch");
      setIsDiscardDialogOpen(true);
    } else {
      setSelectedFieldId(field.id);
    }
  };

  const requestCloseEditor = () => {
    if (isEditorDirty) {
      setPendingFieldId(undefined);
      setDiscardAction("close");
      setIsDiscardDialogOpen(true);
    } else {
      setSelectedFieldId(undefined);
    }
  };

  const handleSaveField = (updatedField: FormField) => {
    setFields((currentFields) =>
      currentFields.map((field) => (field.id === updatedField.id ? updatedField : field))
    );
    setIsEditorDirty(false);

    toast.success("Đã lưu thay đổi thành công");
  };

  const handleSaveAndSwitch = (updatedField: FormField) => {
    handleSaveField(updatedField);
    setSelectedFieldId(pendingFieldId);
    setPendingFieldId(undefined);
    setIsDiscardDialogOpen(false);
  };

  const handleSaveAndClose = (updatedField: FormField) => {
    handleSaveField(updatedField);
    setSelectedFieldId(undefined);
    setIsDiscardDialogOpen(false);
  };

  const handleSaveAndNext = (updatedField: FormField) => {
    handleSaveField(updatedField);
    const currentIndex = fields.findIndex((f) => f.id === updatedField.id);
    if (currentIndex < fields.length - 1) {
      setSelectedFieldId(fields[currentIndex + 1].id);
    }
  };

  const handleDiscardAndSwitch = () => {
    setIsEditorDirty(false);
    setSelectedFieldId(pendingFieldId);
    setPendingFieldId(undefined);
    setIsDiscardDialogOpen(false);
  };

  const handleDiscardAndClose = () => {
    setIsEditorDirty(false);
    setSelectedFieldId(undefined);
    setIsDiscardDialogOpen(false);
  };

  const handleKeepEditing = () => {
    setPendingFieldId(undefined);
    setIsDiscardDialogOpen(false);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(undefined);
      setIsEditorDirty(false);
    }
  };

  const handleNavigatePrevious = () => {
    if (!selectedFieldId) return;
    const currentIndex = fields.findIndex((f) => f.id === selectedFieldId);
    if (currentIndex > 0) {
      requestEditField(fields[currentIndex - 1]);
    }
  };

  const handleNavigateNext = () => {
    if (!selectedFieldId) return;
    const currentIndex = fields.findIndex((f) => f.id === selectedFieldId);
    if (currentIndex < fields.length - 1) {
      requestEditField(fields[currentIndex + 1]);
    }
  };

  const handleSave = async () => {
    if (!election) return;

    await updateMutation.mutateAsync({
      params: { id },
      body: {
        formStructure: buildFormStructure()
      }
    });

    router.history.back();
  };

  const handlePreview = async () => {
    if (!election) return;

    const result = await previewMutation.mutateAsync({
      body: {
        electionId: id,
        formStructure: buildFormStructure()
      }
    });

    setPreviewUrl(result.pdfUrl);
  };

  const currentFieldIndex = selectedFieldId
    ? fields.findIndex((f) => f.id === selectedFieldId)
    : -1;

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/elections">Quản lý cuộc bầu cử</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Thiết kế phiếu bầu</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => router.history.back()}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </header>

      <ScrollArea className="h-full flex-1">
        <div className="p-4">
          <div className="grid h-full grid-cols-12 gap-4">
            {/* Left Panel */}
            <div className="col-span-4 space-y-4 overflow-auto">
              <FieldList
                fields={fields}
                onFieldsChange={setFields}
                onEditField={requestEditField}
                onDeleteField={handleDeleteField}
                onAddField={handleAddField}
                selectedFieldId={selectedFieldId}
              />
            </div>

            {/* Right Panel - Preview */}
            <div className="col-span-8">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-sm">Xem trước phiếu bầu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={handlePreview} disabled={previewMutation.isPending}>
                      {previewMutation.isPending ? "Đang tạo..." : "Xem trước PDF"}
                    </Button>

                    {previewUrl && (
                      <iframe
                        src={previewUrl}
                        className="h-[600px] w-full rounded border"
                        title="Ballot Preview"
                      />
                    )}

                    {!previewUrl && (
                      <div className="text-muted-foreground rounded border p-8 text-center">
                        Nhấn "Xem trước PDF" để tạo bản xem trước phiếu bầu
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Field Properties Sheet */}
      <FieldPropertiesSheet
        ref={sheetRef}
        field={selectedField}
        fieldIndex={currentFieldIndex}
        totalFields={fields.length}
        onSave={handleSaveField}
        onSaveAndNext={handleSaveAndNext}
        onSaveFromDialog={discardAction === "switch" ? handleSaveAndSwitch : handleSaveAndClose}
        onClose={requestCloseEditor}
        onDirtyChange={setIsEditorDirty}
        onNavigatePrevious={handleNavigatePrevious}
        onNavigateNext={handleNavigateNext}
      />

      {/* Discard Changes Dialog */}
      <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bạn có thay đổi chưa lưu</DialogTitle>
            <DialogDescription>
              {discardAction === "switch"
                ? "Bạn muốn lưu thay đổi trước khi chuyển sang trường khác?"
                : "Bạn muốn lưu thay đổi trước khi đóng?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleKeepEditing}>
              Tiếp tục chỉnh sửa
            </Button>
            <Button
              variant="destructive"
              onClick={discardAction === "switch" ? handleDiscardAndSwitch : handleDiscardAndClose}
            >
              Hủy thay đổi
            </Button>
            <Button
              onClick={() => {
                sheetRef.current?.triggerSave();
              }}
            >
              {discardAction === "switch" ? "Lưu & chuyển" : "Lưu & đóng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
