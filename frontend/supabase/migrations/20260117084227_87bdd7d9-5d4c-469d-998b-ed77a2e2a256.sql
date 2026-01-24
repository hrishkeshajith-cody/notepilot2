-- Add important_questions and notes columns to study_packs table
ALTER TABLE public.study_packs 
ADD COLUMN important_questions jsonb DEFAULT '{"one_mark": [], "three_mark": [], "five_mark": []}'::jsonb,
ADD COLUMN notes jsonb DEFAULT '[]'::jsonb;