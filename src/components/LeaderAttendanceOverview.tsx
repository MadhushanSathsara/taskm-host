import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, Clock, CheckCircle, UserX, LogOut } from "lucide-react";

dayjs.extend(duration);

export default function LeaderAttendanceOverview() {
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");

    async function load() {
      const { data, error } = await supabase
        .from("attendances")
        .select("intern_id, check_in, check_out")
        .eq("attendance_date", today);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const grouped: any = {
        present: 0,
        late: 0,
        half_day: 0,
        early_checkout: 0,
        absent: 0,
      };

      // Time thresholds
      const officeStart = dayjs(today + " 08:30");
      const lateCutoff = dayjs(today + " 09:00");
      const absentCutoff = dayjs(today + " 09:15");
      const halfDayEnd = dayjs(today + " 14:00");
      const fullDayEnd = dayjs(today + " 17:30");

      data?.forEach((record) => {
        const checkIn = record.check_in ? dayjs(record.check_in) : null;
        const checkOut = record.check_out ? dayjs(record.check_out) : null;
        let status = "absent";

        if (checkIn) {
          // Determine lateness / absence based on check-in time
          if (checkIn.isAfter(absentCutoff)) {
            status = "absent";
          } else if (checkIn.isAfter(lateCutoff) && checkIn.isBefore(absentCutoff)) {
            status = "late";
          } else {
            // Valid check-in (before 9:00)
            if (checkOut) {
              if (checkOut.isBefore(halfDayEnd)) {
                status = "half_day";
              } else if (checkOut.isBefore(fullDayEnd)) {
                status = "early_checkout";
              } else {
                status = "present";
              }
            } else {
              status = "half_day"; // Checked in but no checkout recorded yet
            }
          }
        }

        grouped[status] = (grouped[status] || 0) + 1;
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
      title: "Early Checkout",
      count: summary.early_checkout || 0,
      color: "text-orange-600",
      icon: <LogOut className="w-5 h-5 text-orange-500" />,
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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

