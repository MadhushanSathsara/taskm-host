import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CheckSquare, LogOut } from "lucide-react";
import TaskCard from "@/components/tasks/TaskCard";
import TaskStats from "@/components/tasks/TaskStats";
import logo from "../../assets/logo.png";
import CheckInOut from "../../components/CheckInOut";
import AttendanceCalendar from "../../components/AttendanceCalendar";
import { useTodayAttendance } from "../../hooks/useAttendance";
import dayjs from "dayjs";

interface InternDashboardProps {
  user: User;
  profile: any;
}

const InternDashboard = ({ user, profile }: InternDashboardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const { record: todayRecord, refresh } = useTodayAttendance(profile.id);

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, email),
        creator_profile:profiles!tasks_created_by_fkey(id, full_name, email)
      `)
      .eq("assigned_to", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading tasks",
        description: error.message,
        variant: "destructive",
      });
    } else setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, [user.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-36 h-16 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Intern Dashboard</h1>
              <p className="text-sm text-muted-foreground">Attendance & Tasks Overview</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-8 space-y-10">
        {/* Attendance Card */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-800">
              🕒 Today’s Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
              <div className="bg-white rounded-lg shadow p-3 hover:shadow-xl transition">
                <p className="text-xs text-muted-foreground">Status</p>
                <p
                  className={`text-lg font-bold ${
                    todayRecord?.status === "present"
                      ? "text-emerald-600"
                      : todayRecord?.status === "late"
                      ? "text-yellow-600"
                      : todayRecord?.status === "half_day"
                      ? "text-purple-600"
                      : "text-red-600"
                  }`}
                >
                  {todayRecord?.status?.toUpperCase() ?? "ABSENT"}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 hover:shadow-xl transition">
                <p className="text-xs text-muted-foreground">Check-In</p>
                <p className="text-lg font-bold text-slate-700">
                  {todayRecord?.check_in
                    ? dayjs(todayRecord.check_in).format("HH:mm")
                    : "-"}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 hover:shadow-xl transition">
                <p className="text-xs text-muted-foreground">Check-Out</p>
                <p className="text-lg font-bold text-slate-700">
                  {todayRecord?.check_out
                    ? dayjs(todayRecord.check_out).format("HH:mm")
                    : "-"}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 hover:shadow-xl transition">
                <p className="text-xs text-muted-foreground">Total Hours</p>
                <p className="text-lg font-bold text-slate-700">
                  {todayRecord?.total_hours ?? "-"}
                </p>
              </div>
            </div>

            {/* Check In/Out */}
            <CheckInOut internId={profile.id} onUpdate={refresh} record={todayRecord} />

            {/* Monthly Attendance */}
            <div className="mt-8">
              <Button
                variant="outline"
                onClick={() => setCalendarOpen(!calendarOpen)}
                className="mb-4"
              >
                {calendarOpen ? "Hide Monthly Attendance" : "View Monthly Attendance"}
              </Button>

              {calendarOpen && (
                <AttendanceCalendar
                  internId={profile.id}
                  onSelectDay={(day) => setSelectedDay(day)}
                />
              )}

              
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <div className="space-y-8">
          <TaskStats tasks={tasks} />
          <div>
            <h2 className="text-2xl font-bold mb-6">My Tasks</h2>
            {loading ? (
              <p className="text-center text-muted-foreground">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No tasks assigned yet.</p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="active">
                    Active ({tasks.filter((t) => t.status === "assigned" || t.status === "in_progress").length})
                  </TabsTrigger>
                  <TabsTrigger value="submitted">
                    Submitted ({tasks.filter((t) => t.status === "submitted").length})
                  </TabsTrigger>
                  <TabsTrigger value="under_review">
                    Under Review ({tasks.filter((t) => t.status === "under_review").length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed ({tasks.filter((t) => t.status === "completed").length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                  {tasks
                    .filter((t) => t.status === "assigned" || t.status === "in_progress")
                    .map((task) => (
                      <TaskCard key={task.id} task={task} onUpdate={loadTasks} isLeader={false} />
                    ))}
                </TabsContent>

                <TabsContent value="submitted" className="space-y-4">
                  {tasks
                    .filter((t) => t.status === "submitted")
                    .map((task) => (
                      <TaskCard key={task.id} task={task} onUpdate={loadTasks} isLeader={false} />
                    ))}
                </TabsContent>

                <TabsContent value="under_review" className="space-y-4">
                  {tasks
                    .filter((t) => t.status === "under_review")
                    .map((task) => (
                      <TaskCard key={task.id} task={task} onUpdate={loadTasks} isLeader={false} />
                    ))}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                  {tasks
                    .filter((t) => t.status === "completed")
                    .map((task) => (
                      <TaskCard key={task.id} task={task} onUpdate={loadTasks} isLeader={false} />
                    ))}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InternDashboard;
