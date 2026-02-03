import { useState, useRef, useCallback } from 'react';
import { Upload, Image, X, Clipboard, Loader } from 'lucide-react';

const IMGBB_API_KEY = 'your_api_key_here'; // Free API - will use a public endpoint

function ImageUpload({ onImageUrl, currentUrl }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || '');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const uploadToImgbb = async (file) => {
    setIsUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Using imgbb free API endpoint
      const response = await fetch('https://api.imgbb.com/1/upload?key=d36eb6591370ae7f9089d85875e56b22', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        const imageUrl = data.data.url;
        setPreview(imageUrl);
        onImageUrl(imageUrl);
        return imageUrl;
      } else {
        throw new Error(data.error?.message || 'Upload fejlede');
      }
    } catch (err) {
      console.error('Upload error:', err);
      
      // Fallback: convert to base64 - this will still work!
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setPreview(base64);
        onImageUrl(base64);
        setError(''); // Clear error since base64 worked
      };
      reader.onerror = () => {
        setError('Kunne ikke læse filen. Prøv en anden fil eller indsæt URL.');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = useCallback((file) => {
    if (!file) return;
    
    // Check file type - allow image/* or common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', '.img', '.tiff', '.tif'];
    const fileName = file.name.toLowerCase();
    const hasImageExtension = imageExtensions.some(ext => fileName.endsWith(ext));
    const hasImageMime = file.type.startsWith('image/');
    
    if (!hasImageMime && !hasImageExtension) {
      setError('Kun billedfiler er tilladt (.jpg, .png, .gif, .webp, .img, etc.)');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Billedet må max være 10MB');
      return;
    }
    
    uploadToImgbb(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  }, [handleFile]);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearImage = () => {
    setPreview('');
    onImageUrl('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add paste listener when component mounts
  useState(() => {
    const handleGlobalPaste = (e) => {
      // Only handle if this component is visible/focused
      if (dropZoneRef.current) {
        handlePaste(e);
      }
    };
    
    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [handlePaste]);

  return (
    <div className="space-y-3">
      <label className="block text-osrs-brown mb-1 text-sm">Billede</label>
      
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPaste={handlePaste}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          isDragging 
            ? 'border-osrs-gold bg-osrs-gold bg-opacity-10' 
            : 'border-osrs-border hover:border-osrs-gold'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.img,.bmp,.tiff,.tif"
          onChange={handleFileInput}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader className="animate-spin text-osrs-gold" size={32} />
            <p className="text-osrs-brown">Uploader...</p>
          </div>
        ) : preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-48 mx-auto rounded border-2 border-osrs-border"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 text-osrs-border">
              <Upload size={24} />
              <span className="text-2xl">eller</span>
              <Clipboard size={24} />
            </div>
            <div className="text-osrs-brown">
              <p className="font-semibold">Træk billede hertil</p>
              <p className="text-sm text-osrs-border">
                eller klik for at vælge fil
              </p>
              <p className="text-xs text-osrs-border mt-2">
                💡 Tip: Brug <kbd className="bg-gray-200 px-1 rounded">Ctrl+V</kbd> for at paste screenshot
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Manual URL input as fallback */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-osrs-border">Eller indsæt URL:</span>
        <input
          type="url"
          value={preview.startsWith('data:') ? '' : preview}
          onChange={(e) => {
            setPreview(e.target.value);
            onImageUrl(e.target.value);
          }}
          placeholder="https://..."
          className="input-osrs flex-1 rounded text-sm py-1"
        />
      </div>
    </div>
  );
}

export default ImageUpload;
