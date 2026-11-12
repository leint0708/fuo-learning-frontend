import React from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Award, CheckCircle, Clock, BarChart2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/authStore";
import { getUserStats } from "@/api/auth";

export const ProfileView: React.FC = () => {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["userStats"],
    queryFn: getUserStats,
  });

  return (
    <div className="max-w-6xl mx-auto w-full px-space-4 py-space-6 flex flex-col gap-space-6">
      {/* Profile Overview Card */}
      <Card className="p-space-6 bg-color-7 border-2 border-color-1 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-space-5">
        <div className="w-20 h-20 rounded-full bg-color-2 text-color-7 flex items-center justify-center border-2 border-color-1 shadow-sm shrink-0">
          <User className="w-10 h-10" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-space-2 mb-1">
            <h1 className="text-text-xl font-bold text-color-1">{user?.fullName || "Học viên"}</h1>
            <Badge variant="primary">Học viên FUO</Badge>
          </div>
          <p className="text-text-sm text-color-1/70 mb-space-2">{user?.email}</p>
          <p className="text-text-xs text-color-1/50">
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

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-color-7 border-2 border-color-1 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-4">
            <Card className="p-space-4 text-center">
              <div className="inline-flex p-2 rounded-full bg-color-2/10 text-color-2 mb-1">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-text-xl font-bold text-color-1">
                {stats?.total_attempts_count ?? 0}
              </div>
              <div className="text-text-xs font-bold text-color-1/60">Lượt thi đã làm</div>
            </Card>

            <Card className="p-space-4 text-center">
              <div className="inline-flex p-2 rounded-full bg-color-3/10 text-color-3 mb-1">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="text-text-xl font-bold text-color-3">
                {stats?.total_exams_passed ?? 0}
              </div>
              <div className="text-text-xs font-bold text-color-1/60">Đề thi đã đạt</div>
            </Card>

            <Card className="p-space-4 text-center">
              <div className="inline-flex p-2 rounded-full bg-color-5/10 text-color-5 mb-1">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div className="text-text-xl font-bold text-color-1">
                {stats?.overall_average_score ? `${stats.overall_average_score.toFixed(1)}/10` : "0.0/10"}
              </div>
              <div className="text-text-xs font-bold text-color-1/60">Điểm trung bình</div>
            </Card>

            <Card className="p-space-4 text-center">
              <div className="inline-flex p-2 rounded-full bg-color-2/10 text-color-2 mb-1">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-text-xl font-bold text-color-1">
                {stats?.total_practice_duration_minutes ?? 0}p
              </div>
              <div className="text-text-xs font-bold text-color-1/60">Thời gian làm bài</div>
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
                <div className="flex justify-between items-start mb-space-2">
                  <h3 className="font-bold text-text-sm text-color-1">{sub.subject_code}</h3>
                  <Badge variant="neutral">{sub.attempts_count} lượt thi</Badge>
                </div>
                <p className="text-text-xs text-color-1/70 mb-space-3 line-clamp-1">
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
