import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare,
  LogOut,
  Plus,
  Users
} from "lucide-react";
import TaskCard from "@/components/tasks/TaskCard";
import CreateTaskDialog from "@/components/tasks/CreateTaskDialog";
import TaskStats from "@/components/tasks/TaskStats";
import logo from "../../assets/logo.png";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface LeaderDashboardProps {
  user: User;
  profile: any;
}

interface AttendanceRecord {
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  total_hours: string | null;
  status: string;
}

interface Intern {
  id: string;
  full_name: string;
  email: string;
  attendances: AttendanceRecord[];
}

const LeaderDashboard = ({ user, profile }: LeaderDashboardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [interns, setInterns] = useState<Intern[]>([]);
  const [loadingInterns, setLoadingInterns] = useState(true);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Load Tasks
  const loadTasks = async () => {
    setLoadingTasks(true);
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, email),
        creator_profile:profiles!tasks_created_by_fkey(id, full_name, email)
      `)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading tasks",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTasks(data || []);
    }
    setLoadingTasks(false);
  };

  // Load Interns & Full Attendance
  const loadInterns = async () => {
    setLoadingInterns(true);

    const { data: internsData, error: internsError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "intern");

    if (internsError) {
      toast({
        title: "Error loading interns",
        description: internsError.message,
        variant: "destructive",
      });
      setLoadingInterns(false);
      return;
    }

    const { data: attendanceData } = await supabase
      .from("attendances")
      .select("*")
      .order("attendance_date", { ascending: true });

    const formatted = internsData?.map((intern: any) => ({
      ...intern,
      attendances: attendanceData
        ?.filter((a) => a.intern_id === intern.id)
        .map((r) => ({
          attendance_date: r.attendance_date,
          check_in: r.check_in,
          check_out: r.check_out,
          total_hours: r.total_hours,
          status: r.status,
        })),
    }));

    setInterns(formatted || []);
    setLoadingInterns(false);
  };

  useEffect(() => {
    loadTasks();
    loadInterns();
  }, [user.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-28 h-14 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Task Manager</h1>
              <p className="text-sm text-gray-500">Leader Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{profile.full_name}</p>
              <p className="text-xs text-gray-400">{profile.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Task Stats */}
        <TaskStats tasks={tasks} />

        {/* Tasks Overview */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Tasks Overview</CardTitle>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {loadingTasks ? (
              <p className="text-gray-500">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckSquare className="w-10 h-10 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No tasks yet. Create your first task!</p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">All Tasks</TabsTrigger>
                  <TabsTrigger value="submitted">
                    Submitted ({tasks.filter(t => t.status === "submitted").length})
                  </TabsTrigger>
                  <TabsTrigger value="under_review">
                    Under Review ({tasks.filter(t => t.status === "under_review").length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed ({tasks.filter(t => t.status === "completed").length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onUpdate={loadTasks} isLeader />
                  ))}
                </TabsContent>

                <TabsContent value="submitted" className="space-y-4">
                  {tasks.filter(t => t.status === "submitted").length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No submitted tasks</p>
                  ) : (
                    tasks
                      .filter(t => t.status === "submitted")
                      .map((task) => (
                        <TaskCard key={task.id} task={task} onUpdate={loadTasks} isLeader />
                      ))
                  )}
                </TabsContent>

                <TabsContent value="under_review" className="space-y-4">
                  {tasks.filter(t => t.status === "under_review").length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No tasks under review</p>
                  ) : (
                    tasks
                      .filter(t => t.status === "under_review")
                      .map((task) => (
                        <TaskCard key={task.id} task={task} onUpdate={loadTasks} isLeader />
                      ))
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                  {tasks.filter(t => t.status === "completed").length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No completed tasks</p>
                  ) : (
                    tasks
                      .filter(t => t.status === "completed")
                      .map((task) => (
                        <TaskCard key={task.id} task={task} onUpdate={loadTasks} isLeader />
                      ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Intern Attendance Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5" /> Intern Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingInterns ? (
              <p className="text-gray-500">Loading intern attendance...</p>
            ) : interns.length === 0 ? (
              <p className="text-gray-500">No interns found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="px-3 py-2 text-left">Intern</th>
                      <th className="px-3 py-2">Today Check-In</th>
                      <th className="px-3 py-2">Today Check-Out</th>
                      <th className="px-3 py-2">Hours</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interns.map((intern) => {
                      const todayRecord = intern.attendances.find(
                        (r) => r.attendance_date === dayjs().format("YYYY-MM-DD")
                      );
                      return (
                        <tr key={intern.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{intern.full_name}</td>
                          <td className="px-3 py-2 text-center">
                            {todayRecord?.check_in ? dayjs(todayRecord.check_in).format("HH:mm") : "-"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {todayRecord?.check_out ? dayjs(todayRecord.check_out).format("HH:mm") : "-"}
                          </td>
                          <td className="px-3 py-2 text-center">{todayRecord?.total_hours ?? "-"}</td>
                          <td className="px-3 py-2 text-center capitalize">{todayRecord?.status ?? "absent"}</td>
                          <td className="px-3 py-2 text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">View</Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Attendance History: {intern.full_name}</DialogTitle>
                                </DialogHeader>
                                <div className="overflow-x-auto mt-4">
                                  <table className="min-w-full border border-gray-200">
                                    <thead>
                                      <tr className="bg-gray-100 text-gray-700">
                                        <th className="px-2 py-1">Date</th>
                                        <th className="px-2 py-1">Check-In</th>
                                        <th className="px-2 py-1">Check-Out</th>
                                        <th className="px-2 py-1">Hours</th>
                                        <th className="px-2 py-1">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {intern.attendances.map((a, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                          <td className="px-2 py-1">{dayjs(a.attendance_date).format("DD MMM YYYY")}</td>
                                          <td className="px-2 py-1 text-center">{a.check_in ? dayjs(a.check_in).format("HH:mm") : "-"}</td>
                                          <td className="px-2 py-1 text-center">{a.check_out ? dayjs(a.check_out).format("HH:mm") : "-"}</td>
                                          <td className="px-2 py-1 text-center">{a.total_hours ?? "-"}</td>
                                          <td className="px-2 py-1 text-center capitalize">{a.status}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadTasks}
      />
    </div>
  );
};

export default LeaderDashboard;
