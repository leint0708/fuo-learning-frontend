import { create } from "zustand";
import type { FeedbackMode, BenchmarkMode } from "@/types/exam";

interface ExamUiState {
  currentQuestionIndex: number;
  activePage: number;
  zoomLevel: number;
  panPosition: { x: number; y: number };
  isAiModalOpen: boolean;
  isSubmitConfirmOpen: boolean;
  feedbackMode: FeedbackMode;
  benchmarkMode: BenchmarkMode;

  // Actions
  setQuestionIndex: (index: number) => void;
  nextQuestion: (totalQuestions: number) => void;
  prevQuestion: () => void;
  setActivePage: (page: number) => void;
  nextPage: (totalPages: number) => void;
  prevPage: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoomLevel: (scale: number) => void;
  setPanPosition: (pos: { x: number; y: number }) => void;
  openAiModal: () => void;
  closeAiModal: () => void;
  openSubmitConfirm: () => void;
  closeSubmitConfirm: () => void;
  setFeedbackMode: (mode: FeedbackMode) => void;
  setBenchmarkMode: (mode: BenchmarkMode) => void;
  resetSessionState: () => void;
}

export const useExamUiStore = create<ExamUiState>((set) => ({
  currentQuestionIndex: 0,
  activePage: 1,
  zoomLevel: 1.25,
  panPosition: { x: 0, y: 0 },
  isAiModalOpen: false,
  isSubmitConfirmOpen: false,
  feedbackMode: "instant",
  benchmarkMode: "ai",

  setQuestionIndex: (index: number) => set({ currentQuestionIndex: index }),

  nextQuestion: (totalQuestions: number) =>
    set((state) => ({
      currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, totalQuestions - 1),
    })),

  prevQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    })),

  setActivePage: (page: number) => set({ activePage: page }),

  nextPage: (totalPages: number) =>
    set((state) => ({
      activePage: Math.min(state.activePage + 1, totalPages),
    })),

  prevPage: () =>
    set((state) => ({
      activePage: Math.max(state.activePage - 1, 1),
    })),

  zoomIn: () =>
    set((state) => ({
      zoomLevel: Math.min(3.0, Number((state.zoomLevel + 0.25).toFixed(2))),
    })),

  zoomOut: () =>
    set((state) => ({
      zoomLevel: Math.max(0.5, Number((state.zoomLevel - 0.25).toFixed(2))),
    })),

  resetZoom: () =>
    set({
      zoomLevel: 1.25,
      panPosition: { x: 0, y: 0 },
    }),

  setZoomLevel: (scale: number) =>
    set({ zoomLevel: Math.max(0.5, Math.min(3.0, Number(scale.toFixed(2)))) }),

  setPanPosition: (pos) => set({ panPosition: pos }),

  openAiModal: () => set({ isAiModalOpen: true }),
  closeAiModal: () => set({ isAiModalOpen: false }),

  openSubmitConfirm: () => set({ isSubmitConfirmOpen: true }),
  closeSubmitConfirm: () => set({ isSubmitConfirmOpen: false }),

  setFeedbackMode: (mode) => set({ feedbackMode: mode }),
  setBenchmarkMode: (mode) => set({ benchmarkMode: mode }),

  resetSessionState: () =>
    set({
      currentQuestionIndex: 0,
      activePage: 1,
      zoomLevel: 1.25,
      panPosition: { x: 0, y: 0 },
      isAiModalOpen: false,
      isSubmitConfirmOpen: false,
    }),
}));
