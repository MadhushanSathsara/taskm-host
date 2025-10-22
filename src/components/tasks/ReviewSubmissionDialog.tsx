import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, FileText, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReviewSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onSuccess: () => void;
}

const ReviewSubmissionDialog = ({ open, onOpenChange, task, onSuccess }: ReviewSubmissionDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    if (open && task) {
      loadSubmission();
      setReviewNotes(task.review_notes || "");
    }
  }, [open, task]);

  const loadSubmission = async () => {
    const { data, error } = await supabase
      .from("task_submissions")
      .select("*")
      .eq("task_id", task.id)
      .single();

    if (error) {
      console.error("Error loading submission:", error);
      return;
    }

    setSubmission(data);
  };

  const getFileUrl = async (filePath: string) => {
    const { data } = supabase.storage
      .from("task-submissions")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleMarkAsComplete = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          review_notes: reviewNotes,
        })
        .eq("id", task.id);

      if (error) throw error;

      toast({ title: "Task marked as complete!" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToUnderReview = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "under_review",
          review_notes: reviewNotes,
        })
        .eq("id", task.id);

      if (error) throw error;

      toast({ title: "Task moved to under review!" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!submission) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Submission</DialogTitle>
          <DialogDescription>
            Review the intern's work and provide feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Task Details</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Title:</strong> {task.title}</p>
              <p><strong>Assigned to:</strong> {task.assigned_to_profile?.full_name}</p>
              <p><strong>Priority:</strong> <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>{task.priority}</Badge></p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Intern's Submission Notes</h3>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm whitespace-pre-wrap">{submission.submission_note || "No notes provided"}</p>
            </div>
          </div>

          {submission.submission_links && submission.submission_links.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Links</h3>
              <div className="space-y-2">
                {submission.submission_links.map((link: string, index: number) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}

          {submission.submission_files && submission.submission_files.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Attached Files</h3>
              <div className="space-y-2">
                {submission.submission_files.map((file: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const url = await getFileUrl(file.path);
                        window.open(url, "_blank");
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="review-notes">Your Review Notes</Label>
            <Textarea
              id="review-notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Provide feedback on the intern's work..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {task.status === "submitted" && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleMoveToUnderReview}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Move to Under Review
            </Button>
          )}
          <Button
            type="button"
            onClick={handleMarkAsComplete}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Mark as Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewSubmissionDialog;
