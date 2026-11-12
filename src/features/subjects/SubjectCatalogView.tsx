import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles, BookOpen } from "lucide-react";
import { SubjectCard } from "./SubjectCard";
import { getSubjects } from "@/api/subjects";

export const SubjectCatalogView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: subjects, isLoading, error } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  });

  const filteredSubjects = (subjects || []).filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto w-full px-space-4 sm:px-space-5 py-space-6 flex flex-col gap-space-6">
      {/* Banner */}
      <div className="bg-color-2 text-color-7 rounded-3xl p-space-6 sm:p-space-7 border-2 border-color-1 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-space-3 py-1 rounded-full bg-color-5 text-color-1 font-bold text-text-xs border border-color-1 mb-space-3 shadow-xs">
            <Sparkles className="w-4 h-4" />
            <span>Ngân hàng đề thi trắc nghiệm học thuật</span>
          </div>
          <h1 className="text-text-xl sm:text-text-2xl font-bold mb-space-2 leading-tight">
            Luyện thi đại học & chứng chỉ thông minh
          </h1>
          <p className="text-text-sm text-color-6/90 mb-space-4">
            Đề thi trắc nghiệm kèm giải thích chi tiết từ mô hình AI, hỗ trợ phản hồi tức thì và đo lường sự đồng thuận cộng đồng.
          </p>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-space-3 top-1/2 -translate-y-1/2 w-5 h-5 text-color-1/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm môn học (vd: MAD101, OSG202)..."
              className="w-full pl-10 pr-space-4 py-space-2 rounded-full border-2 border-color-1 bg-color-7 text-color-1 placeholder-color-1/40 outline-none focus-visible:ring-4 focus-visible:ring-color-5 shadow-xs text-text-sm"
            />
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div>
        <div className="flex justify-between items-center mb-space-4">
          <h2 className="text-text-lg font-bold text-color-1 flex items-center gap-space-2">
            <BookOpen className="w-6 h-6 text-color-2" />
            <span>Danh sách môn học</span>
          </h2>
          <span className="text-text-xs font-bold text-color-1/60">
            {filteredSubjects.length} môn học khả dụng
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-56 bg-color-7 border-2 border-color-1 rounded-2xl animate-pulse shadow-xs"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-space-6 bg-color-4/10 border-2 border-color-4 text-color-4 rounded-3xl font-bold">
            Không thể tải danh sách môn học. Vui lòng thử lại sau.
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-center p-space-8 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm">
            <p className="text-text-base font-bold text-color-1/70">
              Không tìm thấy môn học phù hợp với từ khóa "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-5">
            {filteredSubjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
