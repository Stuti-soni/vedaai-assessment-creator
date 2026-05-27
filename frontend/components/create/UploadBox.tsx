'use client';

import { useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface UploadBoxProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

export function UploadBox({ file, onChange }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    onChange(selected);
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 transition-colors hover:border-purple-300"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleChange}
      />
      {file ? (
        <div className="flex items-center justify-center gap-3">
          <FileText className="text-purple-500 shrink-0" size={24} />
          <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <>
          <Upload className="mx-auto mb-3 text-gray-400" size={28} />
          <p className="text-sm font-medium text-gray-700 mb-1">Choose a file or drag & drop it here</p>
          <p className="text-xs text-gray-400 mb-3">PDF, PNG, JPG — max 10MB</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs border border-gray-300 rounded-lg px-4 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Browse Files
          </button>
        </>
      )}
    </div>
  );
}
