import React, { useRef, type ChangeEvent } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, accept }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        style={{ display: 'none' }}
      />
      <button type="button" onClick={handleButtonClick}>
        Выбрать файл
      </button>
    </div>
  );
};

