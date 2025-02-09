import { useEffect, useState } from "react";

export function PDFViewer({ file }) {
  const [pdfURL, setPdfURL] = useState("");

  useEffect(() => {
    if (file) {
      const fileURL = URL.createObjectURL(file);
      setPdfURL(fileURL);
    }
  }, [file]);

  return (
    <div className="border p-2">
      {pdfURL ? (
        <iframe src={pdfURL} width="100%" height="500px" />
      ) : (
        <p>No PDF selected</p>
      )}
    </div>
  );
}
