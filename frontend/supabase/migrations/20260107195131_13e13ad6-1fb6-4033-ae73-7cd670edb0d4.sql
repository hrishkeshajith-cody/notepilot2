-- Create storage bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('chapter-pdfs', 'chapter-pdfs', false);

-- Allow authenticated users to upload PDFs
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chapter-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read their own PDFs
CREATE POLICY "Users can read their own PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chapter-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own PDFs
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'chapter-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);