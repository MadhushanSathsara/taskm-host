import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CheckSquare, LogOut, Briefcase } from "lucide-react";
import TaskCard from "@/components/tasks/TaskCard";
import TaskStats from "@/components/tasks/TaskStats";
import logo  from "../../assets/logo.png";

interface InternDashboardProps {
  user: User;
  profile: any;
}

const InternDashboard = ({ user, profile }: InternDashboardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    } else {
      setTasks(data || []);
    }
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-35 h-20" />
              <div>
                <h1 className="text-2xl font-bold">Task Manager</h1>
                <p className="text-sm text-muted-foreground">Intern Dashboard</p>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Stats */}
          <TaskStats tasks={tasks} />

          {/* Tasks Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">My Tasks</h2>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No tasks assigned yet. Check back soon!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="active">
                    Active ({tasks.filter(t => t.status === "assigned" || t.status === "in_progress").length})
                  </TabsTrigger>
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

                <TabsContent value="active" className="space-y-4">
                  {tasks.filter(t => t.status === "assigned" || t.status === "in_progress").length === 0 ? (
                    <Card>
                      <CardContent className="py-4 text-center">
                        <p className="text-muted-foreground">No active tasks</p>
                      </CardContent>
                    </Card>
                  ) : (
                    tasks.filter(t => t.status === "assigned" || t.status === "in_progress").map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={loadTasks}
                        isLeader={false}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="submitted" className="space-y-4">
                  {tasks.filter(t => t.status === "submitted").length === 0 ? (
                    <Card>
                      <CardContent className="py-4 text-center">
                        <p className="text-muted-foreground">No submitted tasks</p>
                      </CardContent>
                    </Card>
                  ) : (
                    tasks.filter(t => t.status === "submitted").map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={loadTasks}
                        isLeader={false}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="under_review" className="space-y-4">
                  {tasks.filter(t => t.status === "under_review").length === 0 ? (
                    <Card>
                      <CardContent className="py-4 text-center">
                        <p className="text-muted-foreground">No tasks under review</p>
                      </CardContent>
                    </Card>
                  ) : (
                    tasks.filter(t => t.status === "under_review").map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={loadTasks}
                        isLeader={false}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                  {tasks.filter(t => t.status === "completed").length === 0 ? (
                    <Card>
                      <CardContent className="py-4 text-center">
                        <p className="text-muted-foreground">No completed tasks</p>
                      </CardContent>
                    </Card>
                  ) : (
                    tasks.filter(t => t.status === "completed").map((task) => (
                      <TaskCard 
                        key={task.id}
                        task={task}
                        onUpdate={loadTasks}
                        isLeader={false}
                      />
                    ))
                  )}
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