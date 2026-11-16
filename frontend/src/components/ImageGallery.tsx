import React, { useState } from 'react';
import { ListingImage } from '../types';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

interface ImageGalleryProps {
  images?: ListingImage[];
  title: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images = [], title }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-16/10 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 border border-slate-200">
        <span className="text-5xl mb-2">📦</span>
        <span className="text-sm font-semibold">No photos attached</span>
        <span className="text-xs text-slate-400 mt-1">Listing relies on text description</span>
      </div>
    );
  }

  const activeImage = images[selectedIndex] || images[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3">
      {/* Main Image Container */}
      <div
        onClick={() => setModalOpen(true)}
        className="relative aspect-16/10 bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-md group cursor-pointer"
      >
        <img
          src={activeImage.file_path}
          alt={`${title} - Photo ${selectedIndex + 1}`}
          className="w-full h-full object-contain bg-slate-950/60 transition duration-300 group-hover:scale-102"
        />

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-xs">
            <Maximize2 className="w-3.5 h-3.5" />
            Click to Enlarge
          </span>
        </div>

        {/* Navigation Arrows for multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-xs">
              {selectedIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                selectedIndex === idx
                  ? 'border-indigo-600 ring-2 ring-indigo-200'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img.file_path} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <button
            onClick={() => setModalOpen(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center justify-center"
          >
            <img
              src={activeImage.file_path}
              alt={title}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="text-white text-sm font-semibold mt-4 text-center">
              {title} {images.length > 1 && `(${selectedIndex + 1} of ${images.length})`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

