import React, { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useZoomPan } from "@/hooks/useZoomPan";
import { resolveImageUrl } from "@/utils/imageUrl";

export interface QuestionCanvasProps {
  questionNumber: number;
  questionCode: string;
  questionType?: "single_choice" | "multiple_choice";
  imageUrl: string | null;
  questionTextFallback: string;
}

export const QuestionCanvas: React.FC<QuestionCanvasProps> = ({
  questionNumber,
  questionCode,
  questionType = "single_choice",
  imageUrl,
  questionTextFallback,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const resolvedSrc = resolveImageUrl(imageUrl);

  const {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    transformStyle,
    isDragging,
  } = useZoomPan({ minZoom: 0.5, maxZoom: 3.0, zoomStep: 0.25 });

  // Reset error state on question change, but preserve user's zoom size & pan position
  React.useEffect(() => {
    setImageError(false);
    setIsImageLoading(true);
  }, [resolvedSrc, questionCode]);

  return (
    <div className="flex flex-col h-full bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm overflow-hidden">
      {/* Canvas Viewport Area */}
      <div
        className={`relative flex-1 min-h-[420px] max-h-[600px] bg-color-6/50 overflow-hidden flex items-center justify-center p-space-4 select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Zoom Level Indicator Tag (Top Left) */}
        <div className="absolute top-space-3 left-space-3 z-10 px-space-2 py-0.5 rounded-full bg-color-7/90 border border-color-1 text-text-xs font-bold shadow-xs">
          Câu {questionNumber} ({Math.round(zoomLevel * 100)}%)
        </div>

        {/* Question Type Badge (Top Right) */}
        <div className="absolute top-space-3 right-space-3 z-10 px-space-3 py-0.5 rounded-full bg-color-7/90 border border-color-1 text-text-xs font-bold shadow-xs">
          {questionType === "multiple_choice" ? "Multiple Choice" : "Single Choice"}
        </div>

        {/* Loading Skeleton */}
        {isImageLoading && !imageError && resolvedSrc && (
          <div className="absolute inset-0 flex items-center justify-center bg-color-6 animate-pulse z-0">
            <span className="text-text-xs font-bold text-color-1/50">Đang tải hình ảnh câu hỏi...</span>
          </div>
        )}

        {/* Image Display */}
        {resolvedSrc && !imageError ? (
          <div style={transformStyle} className="max-w-full max-h-full flex items-center justify-center">
            <img
              src={resolvedSrc}
              alt={`Đề thi câu ${questionNumber}`}
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setImageError(true);
                setIsImageLoading(false);
              }}
              className="max-h-[500px] w-auto object-contain rounded-xl pointer-events-none drop-shadow-xs"
              draggable={false}
            />
          </div>
        ) : (
          /* Text Fallback when no image or image error */
          <div className="max-w-xl p-space-6 bg-color-7 border-2 border-color-1 rounded-2xl text-center shadow-xs">
            <AlertTriangle className="w-8 h-8 text-color-5 mx-auto mb-space-2" />
            <h4 className="font-bold text-text-base text-color-1 mb-space-2">
              Câu {questionNumber} ({questionCode})
            </h4>
            <p className="text-text-sm text-color-1 text-left whitespace-pre-wrap leading-relaxed font-medium">
              {questionTextFallback || "Nội dung câu hỏi chưa có hình ảnh sơ đồ."}
            </p>

            {/* Retry Button if an image was expected but failed to load */}
            {imageError && (
              <div className="mt-space-4 flex flex-col items-center gap-space-2">
                <p className="text-text-xs text-color-4 font-semibold">
                  Không thể tải sơ đồ/hình ảnh từ máy chủ.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setImageError(false);
                    setIsImageLoading(true);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Thử tải lại hình ảnh</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Image Toolbar: Zoom In, Zoom Out, Original */}
      <div className="px-space-4 py-space-3 border-t-2 border-color-1 bg-color-7 flex items-center justify-center gap-space-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={zoomIn}
          disabled={zoomLevel >= 3.0}
          className="flex items-center gap-1"
          title="Phóng to"
        >
          <ZoomIn className="w-4 h-4" />
          <span>Zoom in</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={zoomOut}
          disabled={zoomLevel <= 0.5}
          className="flex items-center gap-1"
          title="Thu nhỏ"
        >
          <ZoomOut className="w-4 h-4" />
          <span>Zoom out</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={resetZoom}
          className="flex items-center gap-1"
          title="Kích thước gốc"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Original</span>
        </Button>
      </div>
    </div>
  );
};
