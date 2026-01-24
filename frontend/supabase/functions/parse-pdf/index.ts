/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing PDF for user:", user.id);

    // Get the form data with the PDF file
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("No file provided");
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("File received:", file.name, "Size:", file.size, "Type:", file.type);

    // Validate file type
    if (file.type !== "application/pdf") {
      console.error("Invalid file type:", file.type);
      return new Response(
        JSON.stringify({ error: "Only PDF files are allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("File too large:", file.size);
      return new Response(
        JSON.stringify({ error: "File size must be less than 10MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read the PDF file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log("Extracting text from PDF...");

    // Extract text from PDF using a simple text extraction approach
    // This parses the PDF structure to find text content
    const text = extractTextFromPDF(uint8Array);

    if (!text || text.trim().length < 50) {
      console.log("Could not extract sufficient text, PDF may be image-based");
      return new Response(
        JSON.stringify({ 
          error: "Could not extract text from this PDF. It may be an image-based or scanned PDF. Please copy and paste the text manually." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracted text length:", text.length);

    // Upload the PDF to storage for reference
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("chapter-pdfs")
      .upload(fileName, file, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Continue anyway, text extraction is the main goal
    } else {
      console.log("PDF uploaded to storage:", fileName);
    }

    return new Response(
      JSON.stringify({ 
        text: text.trim(),
        fileName: file.name,
        charactersExtracted: text.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing PDF:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process PDF: " + (error instanceof Error ? error.message : "Unknown error") }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Simple PDF text extraction function
function extractTextFromPDF(data: Uint8Array): string {
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const pdfContent = decoder.decode(data);
  
  const textParts: string[] = [];
  
  // Method 1: Extract text from stream objects (most common)
  const streamRegex = /stream\s*\n?([\s\S]*?)\n?endstream/g;
  let match;
  
  while ((match = streamRegex.exec(pdfContent)) !== null) {
    const streamContent = match[1];
    
    // Look for text show operators: Tj, TJ, ', "
    // Extract text between parentheses for Tj operator
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
      const text = decodeOctalEscapes(tjMatch[1]);
      if (text.trim()) textParts.push(text);
    }
    
    // Extract text from TJ arrays (text with positioning)
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjArrayMatch;
    while ((tjArrayMatch = tjArrayRegex.exec(streamContent)) !== null) {
      const arrayContent = tjArrayMatch[1];
      const textInArray = /\(([^)]*)\)/g;
      let textMatch;
      while ((textMatch = textInArray.exec(arrayContent)) !== null) {
        const text = decodeOctalEscapes(textMatch[1]);
        if (text.trim()) textParts.push(text);
      }
    }
    
    // Look for BT...ET blocks (text blocks)
    const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let btMatch;
    while ((btMatch = btEtRegex.exec(streamContent)) !== null) {
      const textBlock = btMatch[1];
      
      // Extract from this text block
      const innerTjRegex = /\(([^)]*)\)\s*Tj/g;
      let innerMatch;
      while ((innerMatch = innerTjRegex.exec(textBlock)) !== null) {
        const text = decodeOctalEscapes(innerMatch[1]);
        if (text.trim()) textParts.push(text);
      }
    }
  }
  
  // Method 2: Direct text extraction for simpler PDFs
  const directTextRegex = /\(([^\\)]{3,})\)/g;
  let directMatch;
  while ((directMatch = directTextRegex.exec(pdfContent)) !== null) {
    const text = decodeOctalEscapes(directMatch[1]);
    // Filter out binary data and very short strings
    if (text.length > 3 && /^[\x20-\x7E\s]+$/.test(text)) {
      // Avoid duplicates
      if (!textParts.includes(text)) {
        textParts.push(text);
      }
    }
  }
  
  // Clean up and join text
  let result = textParts
    .map(t => t.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove common PDF artifacts
  result = result.replace(/\x00/g, '');
  
  return result;
}

// Decode octal escape sequences in PDF strings
function decodeOctalEscapes(str: string): string {
  return str.replace(/\\([0-7]{1,3})/g, (_, octal) => {
    return String.fromCharCode(parseInt(octal, 8));
  }).replace(/\\(.)/g, (_, char) => {
    switch (char) {
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      case 'b': return '\b';
      case 'f': return '\f';
      case '\\': return '\\';
      case '(': return '(';
      case ')': return ')';
      default: return char;
    }
  });
}
