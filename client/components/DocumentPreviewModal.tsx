import React from "react";
import { X, FileText, Download } from "lucide-react";
import { Button } from "./ui/button";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  fileName: string | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  fileName,
  onClose
}) => {
  if (!isOpen || !fileName) return null;

  const isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/i);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl animate-scaleUp overflow-hidden flex flex-col max-h-[90vh]">
        <div className="border-b px-5 py-4 flex items-center justify-between bg-slate-50">
          <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 truncate">
            <FileText size={18} className="text-[#173c2d] shrink-0" />
            <span className="truncate">{fileName}</span>
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-200 transition shrink-0">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 bg-slate-100 flex flex-col items-center justify-center min-h-[400px]">
          {isImage ? (
            <div className="flex flex-col items-center gap-4 text-slate-400">
               {/* Prototype: We don't have actual file blob, so display a dummy image preview block */}
              <div className="w-64 h-64 bg-slate-200 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                <FileText size={48} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium">Image Preview (Prototype)</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-400 w-full max-w-lg">
               {/* Prototype: PDF / Doc dummy preview */}
               <div className="w-full aspect-[1/1.414] bg-white rounded-sm shadow-md border border-slate-200 p-8">
                 <div className="w-3/4 h-4 bg-slate-100 rounded mb-4"></div>
                 <div className="w-full h-3 bg-slate-50 rounded mb-2"></div>
                 <div className="w-5/6 h-3 bg-slate-50 rounded mb-2"></div>
                 <div className="w-full h-3 bg-slate-50 rounded mb-2"></div>
                 <div className="w-4/5 h-3 bg-slate-50 rounded mb-8"></div>
                 
                 <div className="w-full h-3 bg-slate-50 rounded mb-2"></div>
                 <div className="w-5/6 h-3 bg-slate-50 rounded mb-2"></div>
                 <div className="w-full h-3 bg-slate-50 rounded mb-2"></div>
                 
                 <div className="flex items-center justify-center h-full mt-12 opacity-50">
                    <p className="text-sm text-slate-300 font-bold border-2 border-slate-200 px-4 py-1 rounded rotate-[-15deg]">PROTOTYPE PREVIEW</p>
                 </div>
               </div>
            </div>
          )}
        </div>
        
        <div className="border-t p-4 bg-white flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-slate-200">
            Close
          </Button>
          <Button className="rounded-xl bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center gap-2">
            <Download size={16} />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};
