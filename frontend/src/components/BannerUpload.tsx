import { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE } from '../config/api';

interface BannerUploadProps {
  value?: string;
  onChange: (cid: string | null) => void;
  label?: string;
}

export default function BannerUpload({ value, onChange, label = 'Banner Image (Optional)' }: BannerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ? `https://ipfs.io/ipfs/${value}` : null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to backend
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE}/upload/banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.cid) {
        onChange(response.data.cid);
        toast.success('Banner uploaded successfully');
      } else {
        throw new Error('No CID returned');
      }
    } catch (error: any) {
      console.error('Banner upload failed:', error);
      toast.error(error.response?.data?.error || 'Failed to upload banner');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    toast.success('Banner removed');
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-gray-300">{label}</label>
      <div className="space-y-3">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Banner preview"
              className="w-full h-48 object-cover rounded-lg border-2 border-gray-600"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
              Recommended: 1200x400px (3:1 aspect ratio)
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
              )}
              <p className="mb-2 text-sm text-gray-400">
                {uploading ? 'Uploading...' : 'Click to upload banner'}
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              <p className="text-xs text-gray-500 mt-1">Recommended: 1200x400px</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}

