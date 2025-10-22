import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link as LinkIcon, Upload, X } from "lucide-react";

interface SubmitWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onSuccess: () => void;
}

const SubmitWorkDialog = ({ open, onOpenChange, task, onSuccess }: SubmitWorkDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submissionNote, setSubmissionNote] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [files, setFiles] = useState<File[]>([]);

  const addLinkField = () => {
    setLinks([...links, ""]);
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Filter out empty links
      const validLinks = links.filter(link => link.trim() !== "");

      // Upload files to storage
      const uploadedFiles = [];
      for (const file of files) {
        const filePath = `${user.id}/${task.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("task-submissions")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        uploadedFiles.push({
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type,
        });
      }

      // Create or update submission
      const { error: submissionError } = await supabase
        .from("task_submissions")
        .upsert({
          task_id: task.id,
          intern_id: user.id,
          submission_note: submissionNote,
          submission_links: validLinks.length > 0 ? validLinks : null,
          submission_files: uploadedFiles.length > 0 ? uploadedFiles : null,
        }, {
          onConflict: "task_id,intern_id"
        });

      if (submissionError) throw submissionError;

      // Update task status to submitted
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ status: "submitted" })
        .eq("id", task.id);

      if (taskError) throw taskError;

      toast({ title: "Work submitted successfully!" });
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setSubmissionNote("");
      setLinks([""]);
      setFiles([]);
    } catch (error: any) {
      toast({
        title: "Error submitting work",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Your Work</DialogTitle>
          <DialogDescription>
            Submit your completed work with notes, links, and attachments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Submission Notes</Label>
            <Textarea
              id="note"
              value={submissionNote}
              onChange={(e) => setSubmissionNote(e.target.value)}
              placeholder="Describe what you've completed, challenges faced, etc..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Links (GitHub, Google Drive, Figma, etc.)</Label>
            {links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="url"
                  value={link}
                  onChange={(e) => updateLink(index, e.target.value)}
                  placeholder="https://..."
                />
                {links.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLinkField}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Add Another Link
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Attachments (PDF, DOCX, Images)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="files"
                type="file"
                multiple
                accept=".pdf,.docx,image/*"
                onChange={handleFileChange}
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            {files.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {files.length} file(s) selected
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Work
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitWorkDialog;
