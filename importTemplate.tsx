import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download, Upload } from "lucide-react";
import {
  validateImportData,
  processImportedShifts,
  templateData,
} from "@/utils/importData";
import ExportImportButtons from './ExportImportButtons';

interface ImportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportData: (data: any) => void;
}

export default function ImportDataDialog({
  open,
  onOpenChange,
  onImportData,
}: ImportDataDialogProps) {
  const [jsonData, setJsonData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("json");

  const handleImport = () => {
    try {
      setError(null);
      const parsedData = JSON.parse(jsonData);
      const validatedData = validateImportData(parsedData);

      // Process the data (convert string dates to Date objects for shifts)
      const processedData = {
        ...validatedData,
        shifts: processImportedShifts(validatedData.shifts),
      };

      onImportData(processedData);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid data format");
    }
  };

  const handleDownloadTemplate = () => {
    const dataStr = JSON.stringify(templateData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", "calendar-import-template.json");
    linkElement.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonData(content);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Calendar Data</DialogTitle>
          <DialogDescription>
            Import providers, clinic types, and shifts data in JSON format.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="json">JSON Import</TabsTrigger>
          </TabsList>
          <TabsContent value="json" className="space-y-4 py-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload JSON
                </Button>
              </div>
            </div>

            <Textarea
              placeholder="Paste your JSON data here..."
              className="min-h-[300px] font-mono text-sm"
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport}>Import Data</Button>
        </DialogFooter>
      </DialogContent>
      <ExportImportButtons />
    </Dialog>
  );
}
