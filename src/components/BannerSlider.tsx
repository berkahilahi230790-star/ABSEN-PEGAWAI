import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { BannerInfo } from "../types";

interface BannerSliderProps {
  banners: BannerInfo[];
  onCtaClick?: (ctaText?: string) => void;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({ banners, onCtaClick }) => {
  const activeBanners = banners.filter((b) => b.active);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const current = activeBanners[currentIndex] || activeBanners[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <div className="relative mx-4 my-2.5 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-900 aspect-[16/7.5] sm:aspect-[16/6] group">
      {/* Background Image with subtle gradient overlay */}
      <img
        src={current.imageUrl}
        alt={current.title}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        referrerPolicy="no-referrer"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-slate-900/20 flex flex-col justify-end p-3.5 text-white">
        {/* Badge */}
        {current.badge && (
          <div className="mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600/90 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/20 shadow-xs">
              <Tag className="w-2.5 h-2.5" />
              {current.badge}
            </span>
          </div>
        )}

        {/* Title & Subtitle */}
        <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight drop-shadow-sm line-clamp-1">
          {current.title}
        </h2>
        <p className="text-[11px] text-slate-200 line-clamp-1 mt-0.5 font-medium drop-shadow-xs">
          {current.subtitle}
        </p>

        {/* Action Button & Indicators */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {current.ctaText ? (
            <button
              onClick={() => onCtaClick && onCtaClick(current.ctaText)}
              className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-bold text-[11px] active:scale-95 transition-all shadow-xs"
            >
              {current.ctaText}
            </button>
          ) : (
            <span />
          )}

          {/* Dots Indicator */}
          {activeBanners.length > 1 && (
            <div className="flex items-center gap-1.5">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? "w-5 bg-white" : "w-1.5 bg-white/40"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nav Arrow Controls */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next slide"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
};
