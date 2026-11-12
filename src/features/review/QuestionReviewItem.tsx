import React, { useState } from "react";
import { Check, X, Bot, Users, ChevronDown, ChevronUp, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { resolveImageUrl } from "@/utils/imageUrl";
import { useZoomPan } from "@/hooks/useZoomPan";
import type { ReviewQuestionItem as ReviewItemType } from "@/types/review";

export interface QuestionReviewItemProps {
  item: ReviewItemType;
  index: number;
}

export const QuestionReviewItem: React.FC<QuestionReviewItemProps> = ({ item, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    containerRef,
    transformStyle,
    isDragging,
  } = useZoomPan({ minZoom: 0.5, maxZoom: 3.0, zoomStep: 0.25, initialZoom: 1.0 });

  const isUserCorrect = item.isCorrect;
  const userChoice = item.selectedOptions || "Chưa chọn";
  const correctAnswer = item.correctAnswer;
  const hasCommunityData = item.communityStats && item.communityStats.validVoteCount > 0;

  return (
    <Card className="p-space-5 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm space-y-space-4">
      {/* Question Header & Status */}
      <div className="flex flex-wrap items-center justify-between gap-space-2 pb-space-3 border-b-2 border-color-6">
        <div className="flex items-center gap-space-2">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-text-xs border-2 shadow-2xs ${
              isUserCorrect
                ? "bg-color-3 text-color-7 border-color-3"
                : "bg-color-4 text-color-7 border-color-4"
            }`}
          >
            {index + 1}
          </span>
          <h4 className="font-bold text-text-base text-color-1">
            Câu {index + 1} ({item.questionIdCode})
          </h4>
        </div>

        <div className="flex items-center gap-space-2">
          {isUserCorrect ? (
            <Badge variant="success" className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Trả lời đúng
            </Badge>
          ) : (
            <Badge variant="danger" className="flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Trả lời sai
            </Badge>
          )}

          {hasCommunityData ? (
            <Badge variant="neutral" className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-color-2" />
              <span>
                Cộng đồng: {item.communityStats?.communityAnswer} (
                {Math.round((item.communityStats?.agreementRatio || 0) * 100)}%)
              </span>
            </Badge>
          ) : (
            <Badge variant="warning" className="flex items-center gap-1">
              Sử dụng đáp án AI (Chưa có dữ liệu cộng đồng)
            </Badge>
          )}
        </div>
      </div>

      {/* Question Diagram / Image with Zoom & Pan */}
      {resolveImageUrl(item.imageUrl) && (
        <div className="flex flex-col bg-color-6/40 border-2 border-color-1 rounded-2xl overflow-hidden shadow-2xs">
          {/* Canvas Viewport Area */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`relative flex items-center justify-center min-h-[220px] max-h-[460px] p-space-3 select-none overflow-hidden bg-color-6/30 ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            {/* Zoom Level Indicator Tag */}
            <div className="absolute top-space-2 left-space-2 z-10 px-space-2 py-0.5 rounded-full bg-color-7/90 border border-color-1 text-text-xs font-bold shadow-2xs">
              {Math.round(zoomLevel * 100)}%
            </div>

            <div style={transformStyle} className="flex items-center justify-center max-w-full max-h-full">
              <img
                src={resolveImageUrl(item.imageUrl)!}
                alt={`Câu hỏi ${index + 1}`}
                className="max-h-72 w-auto object-contain rounded-xl pointer-events-none drop-shadow-xs"
                draggable={false}
                loading="lazy"
              />
            </div>
          </div>

          {/* Bottom Zoom Controls Bar */}
          <div className="px-space-3 py-1.5 border-t-2 border-color-1 bg-color-7 flex flex-wrap items-center justify-between gap-space-2">
            <span className="text-text-xs font-bold text-color-1/50 hidden sm:inline">
              Ctrl + Cuộn chuột để phóng to / thu nhỏ
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={zoomIn}
                disabled={zoomLevel >= 3.0}
                className="flex items-center gap-1 px-space-2 py-1 text-text-xs"
                title="Phóng to (Ctrl + Cuộn chuột lên)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Zoom in</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={zoomOut}
                disabled={zoomLevel <= 0.5}
                className="flex items-center gap-1 px-space-2 py-1 text-text-xs"
                title="Thu nhỏ (Ctrl + Cuộn chuột xuống)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span>Zoom out</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={resetZoom}
                className="flex items-center gap-1 px-space-2 py-1 text-text-xs"
                title="Khôi phục kích thước gốc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Original</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Answer Comparison Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-3 p-space-3 bg-color-6 rounded-2xl border-2 border-color-1">
        <div className="flex items-center justify-between px-space-3 py-2 bg-color-7 rounded-xl border border-color-1/40">
          <span className="text-text-xs font-bold text-color-1/70">Đáp án bạn chọn:</span>
          <span
            className={`font-bold text-text-base px-space-2 rounded-md ${
              isUserCorrect ? "text-color-3" : "text-color-4"
            }`}
          >
            {userChoice}
          </span>
        </div>

        <div className="flex items-center justify-between px-space-3 py-2 bg-color-7 rounded-xl border border-color-1/40">
          <span className="text-text-xs font-bold text-color-1/70">Đáp án chuẩn:</span>
          <span className="font-bold text-text-base text-color-3 px-space-2 rounded-md">
            {correctAnswer}
          </span>
        </div>
      </div>

      {/* AI Explanation Box */}
      <div className="p-space-4 bg-color-2/5 border-2 border-color-2/30 rounded-2xl">
        <div className="flex items-center justify-between mb-space-2">
          <div className="flex items-center gap-1.5 font-bold text-text-xs text-color-2">
            <Bot className="w-4 h-4" />
            <span>Lời giải từ AI ({item.aiModel || "gemini-3-flash-preview"}):</span>
          </div>
          {item.optionByOptionAnalysis && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-text-xs font-bold text-color-2 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isExpanded ? "Thu gọn phân tích" : "Chi tiết từng phương án"}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <p className="text-text-xs text-color-1 font-medium leading-relaxed whitespace-pre-wrap">
          {item.aiExplanation || "Đang cập nhật diễn giải cho câu hỏi này."}
        </p>

        {/* Expanded Option Breakdown */}
        {isExpanded && item.optionByOptionAnalysis && (
          <div className="mt-space-3 pt-space-3 border-t border-color-2/20 grid grid-cols-1 sm:grid-cols-2 gap-space-2">
            {Object.entries(item.optionByOptionAnalysis).map(([opt, desc]) => (
              <div
                key={opt}
                className={`p-space-2 rounded-xl text-text-xs border ${
                  opt === correctAnswer
                    ? "bg-color-3/10 border-color-3 text-color-1 font-bold"
                    : "bg-color-7 border-color-1/30 text-color-1/80"
                }`}
              >
                <span className="font-bold text-color-2 mr-1">{opt}:</span>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
