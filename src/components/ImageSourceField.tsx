import React, { useRef, useState } from 'react';
import { Image as ImageIcon, RotateCcw, Upload } from 'lucide-react';

interface ImageSourceFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  helperText?: string;
  maxDimension?: number;
  maxChars?: number;
  defaultValue?: string;
  onChange: (nextUrl: string | undefined) => void;
}

async function compressImageFile(
  file: File,
  maxDim: number,
  maxChars: number
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load selected image.'));
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas rendering context unavailable.');

    ctx.drawImage(img, 0, 0, width, height);

    const hasAlpha = file.type === 'image/png' || file.type === 'image/webp';
    const outputMime = hasAlpha ? 'image/webp' : 'image/jpeg';
    let quality = 0.88;
    let dataUrl = canvas.toDataURL(outputMime, quality);

    while (dataUrl.length > maxChars && quality > 0.35) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL(outputMime, quality);
    }

    if (dataUrl.length > maxChars) {
      throw new Error('Image is still too large after compression. Please use a smaller file or image URL.');
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const ImageSourceField: React.FC<ImageSourceFieldProps> = ({
  label,
  value = '',
  placeholder = 'https://... or upload image from device',
  helperText,
  maxDimension = 760,
  maxChars = 140000,
  defaultValue,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [compressing, setCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setCompressing(true);
    try {
      const compressed = await compressImageFile(file, maxDimension, maxChars);
      onChange(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image.');
    } finally {
      setCompressing(false);
    }
  };

  const hasValue = Boolean(value && value.trim().length > 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-slate-700">{label}</label>
        {hasValue && (
          <button
            type="button"
            onClick={() => {
              setError('');
              onChange(defaultValue !== undefined ? defaultValue : undefined);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-red-600"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{defaultValue !== undefined ? 'Reset Default' : 'Use Vector Artwork'}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="w-12 h-10 rounded-lg border border-slate-200 bg-[#F6F8FB] overflow-hidden flex items-center justify-center shrink-0">
          {hasValue ? (
            <img
              src={value}
              alt={label}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain p-0.5"
            />
          ) : (
            <ImageIcon className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => {
            setError('');
            const next = e.target.value;
            onChange(next.trim() ? next : undefined);
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={compressing}
          className="h-9 px-3 rounded-lg border border-slate-200 bg-[#F6F8FB] hover:bg-slate-100 text-xs font-semibold text-[#06142E] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{compressing ? 'Processing...' : 'Upload'}</span>
        </button>
      </div>

      {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
};
