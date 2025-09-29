import { useCallback, useState } from "react";
import { CloudUpload, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onFileRemove: () => void;
}

export default function FileUpload({ onFileSelect, selectedFile, onFileRemove }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a PDF, JPG, or PNG file.');
      return false;
    }
    
    if (file.size > maxSize) {
      alert('File size must be less than 10MB.');
      return false;
    }
    
    return true;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">Document File</label>
      <div 
        className={cn(
          "file-upload-zone p-8 text-center rounded-lg cursor-pointer transition-all duration-300",
          dragActive && "dragover"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        data-testid="file-upload-zone"
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          data-testid="file-input"
        />
        
        {!selectedFile ? (
          <div className="space-y-4">
            <div className="text-muted-foreground">
              <CloudUpload className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Drop your file here or click to browse</p>
              <p className="text-sm">Supports PDF, JPG, PNG files up to 10MB</p>
            </div>
          </div>
        ) : (
          <div className="bg-secondary p-4 rounded-md inline-flex items-center space-x-3">
            <File className="h-6 w-6 text-primary" />
            <div className="text-left">
              <div className="font-medium text-sm" data-testid="file-name">{selectedFile.name}</div>
              <div className="text-xs text-muted-foreground" data-testid="file-size">
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileRemove();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="file-remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
