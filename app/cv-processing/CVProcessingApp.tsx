"use client"

import { useState } from "react";
import { Upload } from "@/components/ui/upload";
import { Button } from "@/components/ui/button";
import { PDFViewer } from "@/components/ui/pdf-viewer";
import { Textarea } from "@/components/ui/textarea";
import { pdfjs } from "react-pdf";
import { jsPDF } from 'jspdf';
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function CVProcessingApp() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedText, setParsedText] = useState("");
  const [anonymizedText, setAnonymizedText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [editorContent, setEditorContent] = useState('');


  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    const text = await extractTextFromPDF(uploadedFile);
    setParsedText(text);
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    
    return new Promise((resolve, reject) => {
      reader.onload = async function () {
        try {
          if (!reader.result) {
            reject(new Error("Failed to read file"));
            return;
          }
  
          const pdf = await pdfjs.getDocument({ data: reader.result as ArrayBuffer }).promise;
          let extractedText = "";
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            extractedText += textContent.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" ") + "\n";
          }
          
          resolve(extractedText);
        } catch (error) {
          reject(error);
        }
      };
  
      reader.onerror = () => reject(new Error("Error reading file"));
    });
  };

  const handleAnonymization = async () => {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an AI that anonymizes resumes. Follow these rules:
                1. Keep only the first name, remove last name
                2. Remove email addresses, phone numbers, and physical addresses
                3. Remove links to personal websites/portfolios
                4. Remove specific school names but keep degree types and fields
                5. Keep company names but remove specific location details
                6. Maintain all skills, experiences, and achievements
                7. Format the output as clean text with proper spacing and structure`
            },
            {
              role: "user",
              content: `Anonymize this resume while maintaining its professional value: ${parsedText}`
            },
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        setAnonymizedText(data.choices[0].message.content);
      } else {
        console.error("Unexpected response:", data);
      }
    } catch (error) {
      console.error("Error in anonymization:", error);
    }
  };

  const handleChatPrompt = async () => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You modify resumes based on user instructions." },
          { role: "user", content: `Modify the following CV based on this instruction: '${prompt}' \n\n ${anonymizedText || parsedText}` },
        ],
      }),
    });
    const data = await response.json();
    setAnonymizedText(data.choices[0].message.content);
  };

  const generatePDF = (text: string): string => {
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(12);
    
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 15, 15);
    
    const pdfBlob = doc.output('blob');
    return URL.createObjectURL(pdfBlob);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">ATS Builder</h1>
          <p className="text-gray-500 mt-2">Upload, anonymize, and enhance your CV</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Original CV</h2>
              <Upload onUpload={handleFileUpload} />
              {file && (
                <div className="mt-4 border rounded-lg">
                  <iframe 
                    src={URL.createObjectURL(file)} 
                    className="w-full h-[400px]"
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Editor & Instructions</h2>
              <ReactQuill 
                theme="snow"
                value={editorContent}
                onChange={setEditorContent}
                className="h-[200px] mb-4"
              />
              <div className="flex gap-2 mt-8">
                <Button 
                  onClick={handleChatPrompt}
                  variant="secondary"
                >
                  Apply Changes
                </Button>
                <Button 
                  onClick={handleAnonymization}
                  variant="default"
                >
                  Anonymize CV
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Enhanced CV</h2>
            <ScrollArea className="h-[700px] border rounded-lg">
              {anonymizedText ? (
                <iframe 
                  src={generatePDF(anonymizedText)} 
                  className="w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Upload a CV and click "Anonymize CV" to see results
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  );
}

