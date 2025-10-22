-- Add under_review and submitted status to task_status enum if not exists
DO $$ 
BEGIN
  BEGIN
    ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'submitted';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'under_review';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Create storage bucket for task submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-submissions',
  'task-submissions',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create task_submissions table
CREATE TABLE IF NOT EXISTS public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  intern_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  submission_note TEXT,
  submission_links TEXT[],
  submission_files JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, intern_id)
);

-- Enable RLS on task_submissions
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for task_submissions
CREATE POLICY "Interns can submit their own tasks"
ON public.task_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = intern_id);

CREATE POLICY "Interns can update their own submissions"
ON public.task_submissions FOR UPDATE
TO authenticated
USING (auth.uid() = intern_id);

CREATE POLICY "Users can view submissions for their tasks"
ON public.task_submissions FOR SELECT
TO authenticated
USING (
  auth.uid() = intern_id OR
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_submissions.task_id
    AND tasks.created_by = auth.uid()
  )
);

-- Storage policies for task-submissions bucket
CREATE POLICY "Users can upload their own submission files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view submission files for their tasks"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-submissions' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.task_submissions ts
      JOIN public.tasks t ON ts.task_id = t.id
      WHERE t.created_by = auth.uid()
      AND (storage.foldername(name))[1] = ts.intern_id::text
    )
  )
);

CREATE POLICY "Users can delete their own submission files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Add review_notes column to tasks table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'review_notes') THEN
    ALTER TABLE public.tasks ADD COLUMN review_notes TEXT;
  END IF;
END $$;