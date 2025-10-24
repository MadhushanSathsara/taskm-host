import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  User,
  Calendar,
  Link as LinkIcon,
  MessageSquare,
  Trash2,
  Edit,
  Play,
  Square,
} from "lucide-react";
import { format } from "date-fns";
import EditTaskDialog from "./EditTaskDialog";
import TimeTracker from "./TimeTracker";
import SubmitWorkDialog from "./SubmitWorkDialog";
import ReviewSubmissionDialog from "./ReviewSubmissionDialog";

interface TaskCardProps {
  task: any;
  onUpdate: () => void;
  isLeader: boolean;
}

const TaskCard = ({ task, onUpdate, isLeader }: TaskCardProps) => {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      assigned: "bg-yellow-100 text-yellow-700 font-semibold",
      in_progress: "bg-purple-100 text-purple-700 font-semibold",
      submitted: "bg-cyan-100 text-cyan-700 font-semibold",
      under_review: "bg-orange-100 text-yellow-700 font-semibold",
      completed: "bg-green-100 text-green-700 font-semibold",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-info/10 text-info",
      medium: "bg-warning/10 text-warning",
      high: "bg-destructive/10 text-destructive",
    };
    return colors[priority] || "bg-muted text-muted-foreground";
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const { error } = await supabase.from("tasks").delete().eq("id", task.id);

    if (error) {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Task deleted successfully" });
      onUpdate();
    }
  };

  const handleStatusUpdate = async (newStatus: "assigned" | "in_progress" | "submitted" | "under_review" | "completed") => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id);

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Status updated successfully" });
      onUpdate();
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader >
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-xl">{task.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace("_", " ")}
                </Badge>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </div>
            </div>
            {isLeader && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{task.assigned_to_profile?.full_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Due: {format(new Date(task.due_date), "MMM dd, yyyy")}</span>
            </div>
          </div>

          {task.work_link && (
            <div className="flex items-center gap-2 text-sm">
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
              <a
                href={task.work_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                {task.work_link}
              </a>
            </div>
          )}

          {task.leader_comments && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2 ">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Leader Comments</span>
              </div>
              <p className="text-sm text-muted-foreground">{task.leader_comments}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          {!isLeader && (
            <>
              {task.status === "assigned" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate("in_progress")}
                >
                  Start Work
                </Button>
              )}
              {task.status === "in_progress" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowTimeTracker(!showTimeTracker)}
                  >
                    {showTimeTracker ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {showTimeTracker ? "Hide Timer" : "Track Time"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSubmitDialogOpen(true)}
                  >
                    Submit Work
                  </Button>
                </>
              )}
            </>
          )}
          {isLeader && (task.status === "submitted" || task.status === "under_review") && (
            <Button
              size="sm"
              onClick={() => setReviewDialogOpen(true)}
            >
              Review Submission
            </Button>
          )}
        </CardFooter>
      </Card>

      {showTimeTracker && !isLeader && (
        <TimeTracker taskId={task.id} />
      )}

      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={task}
        onSuccess={onUpdate}
      />

      <SubmitWorkDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        task={task}
        onSuccess={onUpdate}
      />

      <ReviewSubmissionDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        task={task}
        onSuccess={onUpdate}
      />
    </>
  );
};

export default TaskCard;