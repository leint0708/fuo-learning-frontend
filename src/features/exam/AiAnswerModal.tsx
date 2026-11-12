import React from "react";
import { Sparkles, Bot, CheckCircle2, HelpCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface AiAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionNumber: number;
  questionCode: string;
  aiChoice?: string | null;
  aiModel?: string | null;
  aiExplanation?: string | null;
  optionByOptionAnalysis?: Record<string, string> | null;
}

export const AiAnswerModal: React.FC<AiAnswerModalProps> = ({
  isOpen,
  onClose,
  questionNumber,
  questionCode,
  aiChoice,
  aiModel = "gemini-3-flash-preview",
  aiExplanation,
  optionByOptionAnalysis,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Giải thích chi tiết từ AI - Câu ${questionNumber} (${questionCode})`}
      size="lg"
    >
      <div className="space-y-space-4">
        {/* Clean, Synchronized Hero Card with AI Choice & Model */}
        <div className="p-space-4 sm:p-space-5 bg-color-2 text-color-7 border-2 border-color-1 rounded-2xl shadow-sm flex flex-col gap-space-3">
          <div className="flex items-center justify-between gap-space-2">
            <div className="flex items-center gap-space-2.5">
              <div className="w-9 h-9 rounded-full bg-color-5 text-color-1 flex items-center justify-center border-2 border-color-1 font-bold shadow-xs shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[12px] font-bold text-color-7/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-color-5" /> Phân tích bởi AI
                </span>
                <span className="text-text-xs font-bold block text-color-7">
                  Trợ lý học tập thông minh
                </span>
              </div>
            </div>

            <div className="px-space-3 py-1 rounded-full bg-color-7 text-color-1 border-2 border-color-1 text-[12px] font-bold shadow-2xs whitespace-nowrap shrink-0">
              {aiModel || "gemini-3-flash-preview"}
            </div>
          </div>

          <div className="pt-space-2.5 border-t border-color-7/20 flex items-center justify-between gap-space-2">
            <span className="text-text-xs sm:text-text-sm font-medium text-color-7/90 whitespace-nowrap">
              Đáp án AI khuyến nghị:
            </span>
            <span className="px-space-3 py-1 rounded-full bg-color-5 text-color-1 border-2 border-color-1 text-text-xs sm:text-text-sm font-bold shadow-xs whitespace-nowrap">
              {aiChoice ? `Lựa chọn ${aiChoice}` : "Chưa xác định"}
            </span>
          </div>
        </div>

        {/* Step-by-step Reasoning Section */}
        <div>
          <h5 className="font-bold text-text-xs sm:text-text-sm text-color-1 mb-space-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-color-3" />
            Các bước giải thích và suy luận logic:
          </h5>
          <div className="p-space-4 bg-color-6 border-2 border-color-1 rounded-2xl text-text-xs text-color-1 font-medium leading-relaxed whitespace-pre-wrap">
            {aiExplanation ||
              "Hiện tại câu hỏi này chưa có diễn giải từng bước chi tiết từ mô hình AI."}
          </div>
        </div>

        {/* Option-by-Option Breakdown */}
        {optionByOptionAnalysis && Object.keys(optionByOptionAnalysis).length > 0 && (
          <div>
            <h5 className="font-bold text-text-xs sm:text-text-sm text-color-1 mb-space-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-color-2" />
              Phân tích từng phương án lựa chọn:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-2.5">
              {Object.entries(optionByOptionAnalysis).map(([opt, desc]) => {
                const isSelectedAi = aiChoice?.includes(opt);
                return (
                  <div
                    key={opt}
                    className={`p-space-3 rounded-2xl border-2 transition-all ${
                      isSelectedAi
                        ? "bg-color-3/10 border-color-3 shadow-xs"
                        : "bg-color-7 border-color-1"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-text-xs mb-1">
                      <span
                        className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-color-7 text-[12px] font-bold ${
                          isSelectedAi ? "bg-color-3" : "bg-color-1"
                        }`}
                      >
                        {opt}
                      </span>
                      <span className={isSelectedAi ? "text-color-3 font-bold" : "text-color-1"}>
                        {isSelectedAi ? "Phương án đúng" : "Phương án sai"}
                      </span>
                    </div>
                    <p className="text-text-xs text-color-1/80 leading-normal font-medium">{desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-space-3 border-t-2 border-color-6 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Đã hiểu, quay lại làm bài
          </Button>
        </div>
      </div>
    </Modal>
  );
};
