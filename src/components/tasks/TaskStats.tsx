import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, FileText, AlertCircle, Eye } from "lucide-react";

interface TaskStatsProps {
  tasks: any[];
}

const TaskStats = ({ tasks }: TaskStatsProps) => {
  const stats = {
    assigned: tasks.filter((t) => t.status === "assigned").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    submitted: tasks.filter((t) => t.status === "submitted").length,
    underReview: tasks.filter((t) => t.status === "under_review").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const statCards = [
    {
      title: "Assigned",
      value: stats.assigned,
      icon: FileText,
      color: "text-status-assigned",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      color: "text-status-in-progress",
    },
    {
      title: "Submitted",
      value: stats.submitted,
      icon: AlertCircle,
      color: "text-status-submitted",
    },
    {
      title: "Under Review",
      value: stats.underReview,
      icon: Eye,
      color: "text-status-under-review",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-status-completed",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {statCards.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TaskStats;