import React, { useRef, type ChangeEvent } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';

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
      <button
        type="button"
        onClick={handleButtonClick}
        aria-label="Выбрать файл"
        style={{
          borderRadius: '8px',
          background: 'linear-gradient(145deg, #ff8c00, #e67600)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 2px 6px rgba(255, 140, 0, 0.3)',
        }}
      >
        <FaCloudUploadAlt />
      </button>
    </div>
  );
};
