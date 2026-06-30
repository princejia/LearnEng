import { BulkImport } from "@/components/admin/BulkImport";

export default function ImportPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">批量导入</h1>
      <BulkImport />
    </div>
  );
}
