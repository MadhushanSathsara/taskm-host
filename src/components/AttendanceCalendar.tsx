import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import dayjs from "dayjs";

interface Record {
  attendance_date: string;
  status: string;
  check_in?: string;
  check_out?: string;
  total_hours?: string;
}

interface Props {
  internId: string;
  onSelectDay?: (record: Record | null) => void;
}

export default function AttendanceCalendar({ internId, onSelectDay }: Props) {
  const [records, setRecords] = useState<Record[]>([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

  useEffect(() => {
    const load = async () => {
      const first = currentMonth.startOf("month").format("YYYY-MM-DD");
      const last = currentMonth.endOf("month").format("YYYY-MM-DD");
      const { data } = await supabase
        .from("attendances")
        .select("*")
        .eq("intern_id", internId)
        .gte("attendance_date", first)
        .lte("attendance_date", last);

      setRecords(data || []);
    };
    load();
  }, [internId, currentMonth]);

  const startDay = currentMonth.startOf("month").day();
  const daysInMonth = currentMonth.daysInMonth();

  const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));
  const nextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));

  const renderDay = (day: number) => {
    const dateStr = currentMonth.date(day).format("YYYY-MM-DD");
    const record = records.find((r) => r.attendance_date === dateStr);

    const bgColor =
      record?.status === "present"
        ? "bg-blue-200"
        : record?.status === "late"
        ? "bg-blue-300"
        : record?.status === "half_day"
        ? "bg-blue-100"
        : record?.status === "absent"
        ? "bg-red-200"
        : "bg-gray-100";

    const completedDateColor =
      record?.status === "completed" ? "bg-blue-400" : bgColor;

    return (
      <div
        key={day}
        className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer hover:shadow-xl transition ${completedDateColor}`}
        onClick={() => {
          setSelectedRecord(record || { attendance_date: dateStr });
          onSelectDay?.(record || { attendance_date: dateStr });
        }}
      >
        <span className="font-semibold text-sm">{day}</span>
        {record && (
          <div className="text-xs mt-1 font-medium text-slate-700">
            <div>Status: {record.status?.toUpperCase()}</div>
          </div>
        )}
      </div>
    );
  };

  const blanks = Array.from({ length: startDay }, (_, i) => <div key={`b${i}`} />);

  return (
    <div className="flex gap-8 p-6">
      {/* Calendar */}
      <div className="bg-white p-4 rounded-xl shadow-md w-1/3 border border-blue-300">
        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevMonth}
            className="px-3 py-1 bg-blue-200 text-blue-700 rounded hover:bg-blue-300 transition"
          >
            Prev
          </button>
          <h3 className="text-lg font-bold">{currentMonth.format("MMMM YYYY")}</h3>
          <button
            onClick={nextMonth}
            className="px-3 py-1 bg-blue-200 text-blue-700 rounded hover:bg-blue-300 transition"
          >
            Next
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 text-center font-medium text-slate-600 mb-2 text-sm">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {blanks}
          {Array.from({ length: daysInMonth }, (_, i) => renderDay(i + 1))}
        </div>
      </div>

      {/* Day Details (Only on the Right Side) */}
      <div className="flex-1 bg-white p-4 rounded-xl shadow-md border border-blue-300">
        {selectedRecord ? (
          <div>
            <h2 className="text-xl font-bold text-blue-600 mb-4">
              Details for {selectedRecord.attendance_date}
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className="text-blue-700">{selectedRecord.status?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Check-in:</span>
                <span>{selectedRecord.check_in ?? "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Check-out:</span>
                <span>{selectedRecord.check_out ?? "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Hours:</span>
                <span>{selectedRecord.total_hours ?? "N/A"}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Select a day to view details</p>
        )}
      </div>
    </div>
  );
}
