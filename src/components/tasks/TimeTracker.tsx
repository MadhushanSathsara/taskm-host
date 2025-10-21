import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Clock } from "lucide-react";

interface TimeTrackerProps {
  taskId: string;
}

const TimeTracker = ({ taskId }: TimeTrackerProps) => {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);

  useEffect(() => {
    loadTimeLogs();
  }, [taskId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const loadTimeLogs = async () => {
    const { data } = await supabase
      .from("time_logs")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });
    
    setTimeLogs(data || []);
  };

  const startTracking = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("time_logs")
        .insert({
          task_id: taskId,
          intern_id: user.id,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentLogId(data.id);
      setIsTracking(true);
      setElapsedTime(0);
      toast({ title: "Time tracking started" });
    } catch (error: any) {
      toast({
        title: "Error starting tracker",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const stopTracking = async () => {
    if (!currentLogId) return;

    try {
      const totalHours = elapsedTime / 3600;
      const { error } = await supabase
        .from("time_logs")
        .update({
          end_time: new Date().toISOString(),
          total_hours: totalHours,
        })
        .eq("id", currentLogId);

      if (error) throw error;

      setIsTracking(false);
      setCurrentLogId(null);
      setElapsedTime(0);
      loadTimeLogs();
      toast({ title: "Time tracking stopped" });
    } catch (error: any) {
      toast({
        title: "Error stopping tracker",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalHours = timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Session</p>
            <p className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</p>
          </div>
          <Button
            onClick={isTracking ? stopTracking : startTracking}
            variant={isTracking ? "destructive" : "default"}
          >
            {isTracking ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-2">Total Time Logged</p>
          <p className="text-lg font-semibold">{totalHours.toFixed(2)} hours</p>
          {timeLogs.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">Recent Sessions:</p>
              {timeLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="text-xs flex justify-between">
                  <span>{new Date(log.start_time).toLocaleDateString()}</span>
                  <span className="font-mono">{log.total_hours?.toFixed(2) || "0.00"}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeTracker;