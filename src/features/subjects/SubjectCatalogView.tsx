import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  BookOpen,
  X,
  RotateCcw,
  AlertCircle,
  Zap,
  ChevronRight,
} from "lucide-react";
import { SubjectCard } from "./SubjectCard";
import { ActiveExamsSection } from "./ActiveExamsSection";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/utils/error";
import { getSubjects } from "@/api/subjects";
import {
  getPracticeProgressSummary,
  syncSubjectProgressWithServer,
} from "@/api/practice";
import { useAuthStore } from "@/stores/authStore";
import {
  computeUnsyncedLocalDelta,
  getSubjectLocalProgress,
  normalizeSearchText,
  type SubjectLocalProgress,
} from "@/utils/practiceProgress";

export const SubjectCatalogView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Danh sách môn học | FUO Learning";
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = document.activeElement as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [syncRevision, setSyncRevision] = useState(0);

  const { data: subjects, isLoading, error, refetch } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  });

  const { data: serverSummary, isSuccess: isServerSummaryLoaded } = useQuery({
    queryKey: ["practiceProgressSummary"],
    queryFn: getPracticeProgressSummary,
    enabled: isAuthenticated,
    retry: false,
  });

  const syncedInMountRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || !subjects || subjects.length === 0 || !isServerSummaryLoaded) {
      return;
    }

    const summaryByCode = new Map(
      (serverSummary ?? []).map((item) => [item.subjectCode.toUpperCase(), item])
    );

    const subjectsToReconcile = subjects.filter((s) => {
      const code = s.code.toUpperCase();
      if (syncedInMountRef.current.has(code)) return false;
      const delta = computeUnsyncedLocalDelta(s.code);
      if (delta.hasChanges) return true;
      const local = getSubjectLocalProgress(s.code);
      const remote = summaryByCode.get(code);
      const remoteCram = remote?.cramCount ?? 0;
      const remoteLearn = remote?.learnCount ?? 0;
      return local.cramCount !== remoteCram || local.learnCount !== remoteLearn;
    });

    if (subjectsToReconcile.length === 0) return;

    let cancelled = false;
    void (async () => {
      let anySynced = false;
      for (const s of subjectsToReconcile) {
        const code = s.code.toUpperCase();
        syncedInMountRef.current.add(code);
        try {
          await syncSubjectProgressWithServer(s.code);
          anySynced = true;
        } catch {
          // Ignore offline/network sync failures silently
        }
      }
      if (!cancelled && anySynced) {
        setSyncRevision((r) => r + 1);
        void queryClient.invalidateQueries({ queryKey: ["practiceProgressSummary"] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, subjects, serverSummary, isServerSummaryLoaded, queryClient]);

  const progressMap = useMemo(() => {
    const map = new Map<string, SubjectLocalProgress>();
    const summaryByCode = new Map(
      (serverSummary ?? []).map((item) => [item.subjectCode.toUpperCase(), item])
    );
    for (const s of subjects || []) {
      const local = getSubjectLocalProgress(s.code);
      const remote = summaryByCode.get(s.code.toUpperCase());
      if (isAuthenticated && isServerSummaryLoaded) {
        const delta = computeUnsyncedLocalDelta(s.code);
        const cramCount = delta.hasChanges
          ? Math.max(local.cramCount, remote?.cramCount ?? 0)
          : (remote?.cramCount ?? 0);
        const learnCount = delta.hasChanges
          ? Math.max(local.learnCount, remote?.learnCount ?? 0)
          : (remote?.learnCount ?? 0);
        map.set(s.code, {
          cramCount,
          learnCount,
          hasProgress: cramCount > 0 || learnCount > 0,
        });
      } else {
        map.set(s.code, local);
      }
    }
    return map;
  }, [subjects, serverSummary, isAuthenticated, isServerSummaryLoaded, syncRevision]);

  const inProgressSubjects = useMemo(
    () => (subjects || []).filter((s) => progressMap.get(s.code)?.hasProgress),
    [subjects, progressMap]
  );

  const prefixGroups = useMemo(() => {
    if (!subjects || subjects.length <= 6) return [];
    const prefixes = Array.from(
      new Set(subjects.map((s) => s.code.slice(0, 3).toUpperCase()))
    ).sort();
    return prefixes.length > 1 ? prefixes : [];
  }, [subjects]);

  const showFilterBar =
    !isLoading &&
    !error &&
    (subjects?.length ?? 0) > 0 &&
    (inProgressSubjects.length > 0 || prefixGroups.length > 1);

  const normalizedQuery = normalizeSearchText(searchQuery);
  const totalSubjects = subjects?.length ?? 0;

  const filteredSubjects = useMemo(() => {
    return (subjects || []).filter((s) => {
      if (activeFilter === "in_progress" && !progressMap.get(s.code)?.hasProgress) {
        return false;
      }
      if (
        activeFilter !== "all" &&
        activeFilter !== "in_progress" &&
        s.code.slice(0, 3).toUpperCase() !== activeFilter
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      return (
        normalizeSearchText(s.code).includes(normalizedQuery) ||
        normalizeSearchText(s.title).includes(normalizedQuery)
      );
    });
  }, [subjects, activeFilter, normalizedQuery, progressMap]);

  const hasActiveFilters = Boolean(normalizedQuery) || activeFilter !== "all";

  const countStatusText = isLoading
    ? "Đang tải..."
    : error
      ? ""
      : hasActiveFilters
        ? `${filteredSubjects.length}/${totalSubjects} môn học phù hợp`
        : `${totalSubjects} môn học`;

  const resetFilters = () => {
    setSearchQuery("");
    setActiveFilter("all");
    searchInputRef.current?.focus();
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-space-2 sm:px-space-5 py-space-4 sm:py-space-5 flex flex-col gap-space-4 sm:gap-space-5">
      {/* Compact Hero Banner */}
      <div
        data-impeccable-ignore="hard-offset-shadow"
        className="bg-color-2 text-color-7 rounded-3xl p-space-4 sm:p-space-5 border-2 border-color-1 shadow-sm relative overflow-hidden"
      >
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-text-lg sm:text-text-xl font-bold mb-space-1 leading-tight">
            Ôn tập &amp; luyện đề học kỳ FPTU
          </h1>
          <p className="text-text-xs sm:text-text-sm text-color-6/95 mb-space-4">
            Thi thử chuẩn FE/PE, ôn cấp tốc 10 câu hoặc học ghi nhớ ngắt quãng — kèm giải thích AI từng câu.
          </p>

          {/* Search Landmark */}
          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="relative max-w-md"
          >
            <Search
              className="absolute left-space-3 top-1/2 -translate-y-1/2 w-5 h-5 text-color-1/75 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              aria-label="Tìm theo mã hoặc tên môn học"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && searchQuery) {
                  e.preventDefault();
                  setSearchQuery("");
                }
              }}
              placeholder="Tìm mã hoặc tên môn (vd: MAD101, PRM392)..."
              className="w-full pl-11 pr-12 py-space-2 rounded-full border-2 border-color-1 bg-color-7 text-color-1 placeholder:text-color-1/70 outline-none focus-visible:ring-4 focus-visible:ring-color-5 shadow-xs text-text-sm"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-space-1 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center rounded-full text-color-1/80 hover:text-color-1 hover:bg-color-6 transition-colors duration-fast cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <kbd
                aria-hidden="true"
                className="hidden sm:inline-flex items-center justify-center absolute right-space-3 top-1/2 -translate-y-1/2 px-space-1 py-0.5 text-text-2xs font-bold text-color-1/70 bg-color-6 border border-color-1/40 rounded pointer-events-none"
              >
                /
              </kbd>
            )}
          </form>
        </div>
      </div>

      {/* Active In-Progress Exams */}
      <ActiveExamsSection />

      {/* Quick Resume Strip for Active Subjects */}
      {!isLoading &&
        !error &&
        inProgressSubjects.length > 0 &&
        !hasActiveFilters && (
          <section
            aria-label="Tiếp tục ôn tập"
            className="flex flex-col gap-space-2"
          >
            <div className="flex items-center gap-space-2">
              <Zap
                className="w-4 h-4 text-color-2 fill-color-5"
                aria-hidden="true"
              />
              <h2 className="text-text-sm font-bold text-color-1">
                Tiếp tục ôn tập
              </h2>
            </div>
            <div className="flex flex-wrap gap-space-2">
              {inProgressSubjects.slice(0, 4).map((subject) => {
                const prog = progressMap.get(subject.code);
                const countText =
                  prog && prog.learnCount >= prog.cramCount && prog.learnCount > 0
                    ? `${prog.learnCount} câu Learn`
                    : `${prog?.cramCount ?? 0} câu Cram`;
                return (
                  <Link
                    key={subject.id}
                    to={`/subjects/${encodeURIComponent(subject.code)}`}
                    data-impeccable-ignore="hard-offset-shadow"
                    className="inline-flex items-center gap-space-2 min-h-[44px] px-space-3 py-space-1 rounded-full border-2 border-color-1 bg-color-7 text-color-1 shadow-xs hover:bg-color-5 active:translate-y-0.5 transition-all duration-fast outline-none focus-visible:ring-4 focus-visible:ring-color-5"
                  >
                    <span className="font-bold text-text-xs">{subject.code}</span>
                    <span className="text-text-2xs font-bold text-color-3 tabular-nums">
                      {countText}
                    </span>
                    <ChevronRight className="w-4 h-4 text-color-1/70" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      {/* Catalog Section */}
      <section aria-label="Ngân hàng môn học">
        <div className="flex flex-wrap justify-between items-center gap-space-2 mb-space-3">
          <h2 className="text-text-lg font-bold text-color-1 flex items-center gap-space-2">
            <BookOpen className="w-6 h-6 text-color-2" aria-hidden="true" />
            <span>Danh sách môn học</span>
          </h2>
          {countStatusText && (
            <span
              aria-live="polite"
              className="text-text-xs font-bold text-color-1/80 tabular-nums"
            >
              {countStatusText}
            </span>
          )}
        </div>

        {/* Discipline & Progress Filter Pills */}
        {showFilterBar && (
          <div
            role="group"
            aria-label="Bộ lọc môn học"
            className="flex flex-wrap items-center gap-space-2 mb-space-4"
          >
            <button
              type="button"
              aria-pressed={activeFilter === "all"}
              data-impeccable-ignore="hard-offset-shadow"
              onClick={() => setActiveFilter("all")}
              className={`min-h-11 px-space-3 py-space-1 rounded-full border-2 text-[13px] sm:text-text-xs font-bold transition-all duration-fast cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 ${
                activeFilter === "all"
                  ? "bg-color-2 text-color-7 border-color-1 shadow-xs"
                  : "bg-color-7 text-color-1 border-color-1 hover:bg-color-6"
              }`}
            >
              Tất cả ({totalSubjects})
            </button>

            {inProgressSubjects.length > 0 && (
              <button
                type="button"
                aria-pressed={activeFilter === "in_progress"}
                data-impeccable-ignore="hard-offset-shadow"
                onClick={() => setActiveFilter("in_progress")}
                className={`min-h-11 px-space-3 py-space-1 rounded-full border-2 text-[13px] sm:text-text-xs font-bold transition-all duration-fast cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 ${
                  activeFilter === "in_progress"
                    ? "bg-color-3 text-color-7 border-color-1 shadow-xs"
                    : "bg-color-7 text-color-1 border-color-1 hover:bg-color-6"
                }`}
              >
                Đang ôn tập ({inProgressSubjects.length})
              </button>
            )}

            {prefixGroups.map((prefix) => (
              <button
                key={prefix}
                type="button"
                aria-pressed={activeFilter === prefix}
                data-impeccable-ignore="hard-offset-shadow"
                onClick={() => setActiveFilter(prefix)}
                className={`min-h-11 px-space-3 py-space-1 rounded-full border-2 text-[13px] sm:text-text-xs font-bold transition-all duration-fast cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 ${
                  activeFilter === prefix
                    ? "bg-color-5 text-color-1 border-color-1 shadow-xs"
                    : "bg-color-7 text-color-1 border-color-1 hover:bg-color-6"
                }`}
              >
                {prefix}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div
            role="status"
            aria-busy="true"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-4 sm:gap-space-5"
          >
            <span className="sr-only">Đang tải danh sách môn học...</span>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                data-impeccable-ignore="hard-offset-shadow"
                className="h-56 bg-color-7 border-2 border-color-1 rounded-3xl animate-pulse shadow-xs"
              />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            data-impeccable-ignore="hard-offset-shadow"
            className="text-center p-space-5 sm:p-space-6 bg-color-7 border-2 border-color-4 text-color-1 rounded-3xl shadow-sm flex flex-col items-center gap-space-3"
          >
            <div className="flex items-center gap-space-2 text-text-base font-bold text-color-1">
              <AlertCircle
                className="w-5 h-5 text-color-4 shrink-0"
                aria-hidden="true"
              />
              <span>Không thể tải danh sách môn học</span>
            </div>
            <p className="text-text-xs font-bold text-color-1/80 max-w-md">
              {getErrorMessage(
                error,
                "Kết nối đến máy chủ gặp sự cố. Vui lòng thử tải lại sau ít giây."
              )}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="flex items-center gap-space-1"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Thử tải lại</span>
            </Button>
          </div>
        ) : !subjects || subjects.length === 0 ? (
          <div
            data-impeccable-ignore="hard-offset-shadow"
            className="text-center p-space-5 sm:p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm flex flex-col items-center gap-space-3"
          >
            <p className="text-text-base font-bold text-color-1">
              Chưa có môn học nào trong hệ thống.
            </p>
            <p className="text-text-xs text-color-1/75 max-w-md">
              Ngân hàng môn học đang được cập nhật. Bạn có thể thử tải lại trang.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="flex items-center gap-space-1"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Tải lại danh sách</span>
            </Button>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div
            role="status"
            data-impeccable-ignore="hard-offset-shadow"
            className="text-center p-space-5 sm:p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm flex flex-col items-center gap-space-3"
          >
            <p className="text-text-base font-bold text-color-1">
              {normalizedQuery
                ? `Không tìm thấy môn học nào khớp với "${searchQuery.trim()}".`
                : "Không có môn học nào trong bộ lọc hiện tại."}
            </p>
            <p className="text-text-xs text-color-1/75">
              Kiểm tra lại mã môn (vd: MAD101, OSG202) hoặc đặt lại bộ lọc.
            </p>
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Đặt lại bộ lọc
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-4 sm:gap-space-5">
            {filteredSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                progress={progressMap.get(subject.code)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
