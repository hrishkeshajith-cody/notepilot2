-- Create study_packs table
CREATE TABLE public.study_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chapter_title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  summary JSONB NOT NULL,
  key_terms JSONB NOT NULL,
  flashcards JSONB NOT NULL,
  quiz JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.study_packs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own study packs" 
ON public.study_packs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study packs" 
ON public.study_packs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study packs" 
ON public.study_packs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study packs" 
ON public.study_packs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_study_packs_user_id ON public.study_packs(user_id);
CREATE INDEX idx_study_packs_created_at ON public.study_packs(created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_study_packs_updated_at
BEFORE UPDATE ON public.study_packs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();