import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Award, CheckCircle, Clock, BarChart2, AlertCircle, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { getUserStats } from "@/api/auth";
import { getErrorMessage } from "@/utils/error";

export const ProfileView: React.FC = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    document.title = "Hồ sơ cá nhân | FUO Learning";
  }, []);

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userStats"],
    queryFn: getUserStats,
  });

  return (
    <div className="max-w-6xl mx-auto w-full px-space-3 sm:px-space-4 py-space-5 sm:py-space-6 flex flex-col gap-space-5 sm:gap-space-6">
      {/* Profile Overview Card */}
      <Card className="p-space-4 sm:p-space-6 bg-color-7 border-2 border-color-1 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-space-4 sm:gap-space-5">
        <div
          data-impeccable-ignore="hard-offset-shadow"
          className="w-20 h-20 rounded-full bg-color-2 text-color-7 flex items-center justify-center border-2 border-color-1 shadow-sm shrink-0"
        >
          <User className="w-10 h-10" />
        </div>
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-space-2 mb-space-1">
            <h1 className="text-text-xl font-bold text-color-1 truncate">
              {user?.fullName || "Học viên"}
            </h1>
            <Badge variant="primary">Học viên FUO</Badge>
          </div>
          <p className="text-text-sm text-color-1/80 mb-space-2 break-all">{user?.email}</p>
          <p className="text-text-xs text-color-1/75 font-medium">
            Ngày tham gia:{" "}
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Hôm nay"}
          </p>
        </div>
      </Card>

      {/* Aggregate Statistics */}
      <div>
        <h2 className="text-text-lg font-bold text-color-1 mb-space-4 flex items-center gap-space-2">
          <BarChart2 className="w-6 h-6 text-color-2" />
          <span>Thống kê luyện tập</span>
        </h2>

        {isError ? (
          <Card
            role="alert"
            className="p-space-5 bg-color-7 border-2 border-color-4 flex flex-col sm:flex-row items-center justify-between gap-space-4"
          >
            <div className="flex items-center gap-space-3 text-color-1">
              <AlertCircle className="w-6 h-6 text-color-4 shrink-0" />
              <div>
                <h3 className="text-text-sm font-bold text-color-1">
                  Không thể tải thống kê học tập
                </h3>
                <p className="text-text-xs text-color-1/75">
                  {getErrorMessage(error, "Đã xảy ra lỗi khi kết nối máy chủ.")}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="flex items-center gap-space-1 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử tải lại</span>
            </Button>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-color-7 border-2 border-color-1 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-2 sm:gap-space-4">
            <Card className="p-space-3 sm:p-space-4 text-center">
              <div className="inline-flex p-space-2 rounded-full bg-color-2/10 text-color-2 mb-space-1">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-text-lg sm:text-text-xl font-bold text-color-1 tabular-nums">
                {stats?.total_attempts_count ?? 0}
              </div>
              <div className="text-[13px] sm:text-text-xs font-bold text-color-1/75">Lượt thi đã làm</div>
            </Card>

            <Card className="p-space-3 sm:p-space-4 text-center">
              <div className="inline-flex p-space-2 rounded-full bg-color-3/10 text-color-3 mb-space-1">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="text-text-lg sm:text-text-xl font-bold text-color-3 tabular-nums">
                {stats?.total_exams_passed ?? 0}
              </div>
              <div className="text-[13px] sm:text-text-xs font-bold text-color-1/75">Đề thi đã đạt</div>
            </Card>

            <Card className="p-space-3 sm:p-space-4 text-center">
              <div className="inline-flex p-space-2 rounded-full bg-color-5/10 text-color-5 mb-space-1">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div className="text-text-lg sm:text-text-xl font-bold text-color-1 tabular-nums">
                {stats?.overall_average_score
                  ? `${stats.overall_average_score.toFixed(1)}/10`
                  : "0.0/10"}
              </div>
              <div className="text-[13px] sm:text-text-xs font-bold text-color-1/75">Điểm trung bình</div>
            </Card>

            <Card className="p-space-3 sm:p-space-4 text-center">
              <div className="inline-flex p-space-2 rounded-full bg-color-2/10 text-color-2 mb-space-1">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-text-lg sm:text-text-xl font-bold text-color-1 tabular-nums">
                {stats?.total_practice_duration_minutes ?? 0}p
              </div>
              <div className="text-[13px] sm:text-text-xs font-bold text-color-1/75">Thời gian làm bài</div>
            </Card>
          </div>
        )}
      </div>

      {/* Subject Breakdown */}
      {stats?.subject_breakdowns && stats.subject_breakdowns.length > 0 && (
        <div>
          <h2 className="text-text-lg font-bold text-color-1 mb-space-4">Chi tiết theo môn học</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-space-4">
            {stats.subject_breakdowns.map((sub) => (
              <Card key={sub.subject_code} className="p-space-4">
                <div className="flex justify-between items-start gap-space-2 mb-space-2">
                  <h3 className="font-bold text-text-sm text-color-1 min-w-0 truncate">{sub.subject_code}</h3>
                  <Badge variant="neutral" className="shrink-0">{sub.attempts_count} lượt thi</Badge>
                </div>
                <p className="text-text-xs text-color-1/75 mb-space-3 line-clamp-1">
                  {sub.subject_title}
                </p>
                <div className="flex justify-between items-center text-text-xs font-bold pt-space-2 border-t border-color-1/20">
                  <span>Điểm TB: {sub.average_score.toFixed(1)}</span>
                  <span className="text-color-3">Đạt: {sub.passed_exams_count}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
