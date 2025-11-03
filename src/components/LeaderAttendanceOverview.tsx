import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import dayjs from "dayjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, Clock, CheckCircle, AlertTriangle, UserX } from "lucide-react";

export default function LeaderAttendanceOverview() {
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");
    async function load() {
      const { data } = await supabase
        .from("attendances")
        .select("status")
        .eq("attendance_date", today);

      const grouped: any = {};
      data?.forEach((r) => {
        grouped[r.status] = (grouped[r.status] || 0) + 1;
      });
      setSummary(grouped);
      setLoading(false);
    }
    load();
  }, []);

  const statusCards = [
    {
      title: "Present",
      count: summary.present || 0,
      color: "text-emerald-600",
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    },
    {
      title: "Late",
      count: summary.late || 0,
      color: "text-yellow-600",
      icon: <Clock className="w-5 h-5 text-yellow-500" />,
    },
    {
      title: "Half Day",
      count: summary.half_day || 0,
      color: "text-purple-600",
      icon: <BarChart3 className="w-5 h-5 text-purple-500" />,
    },
    {
      title: "Absent",
      count: summary.absent || 0,
      color: "text-red-600",
      icon: <UserX className="w-5 h-5 text-red-500" />,
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800">
          Today's Attendance Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading attendance...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statusCards.map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center justify-center bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="mb-2">{item.icon}</div>
                <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
                <p className="text-sm text-muted-foreground">{item.title}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
