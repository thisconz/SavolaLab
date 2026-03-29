import { jsPDF } from "jspdf";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

export const PdfUtil = {
  async generateAndUploadCertificate(
    certId: string,
    data: any,
  ): Promise<string> {
    const doc = new jsPDF();
    const fileName = `certificate_${certId}.pdf`;

    // --- PDF Generation Logic (Keep as is) ---
    doc.setFontSize(22);
    doc.text("SAVOLA LAB QUALITY CERTIFICATE", 105, 20, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    doc.setFontSize(12);
    doc.text(`Certificate ID: ${certId}`, 20, 40);
    doc.text(`Batch ID: ${data.batchId}`, 20, 50);
    doc.text(`Version: ${data.version}`, 20, 60);
    doc.text(`Status: ${data.status}`, 20, 70);
    doc.text(`Issued Date: ${new Date().toLocaleString()}`, 20, 80);
    doc.line(20, 85, 190, 85);
    doc.setFontSize(14);
    doc.text("Analysis Results:", 20, 100);
    doc.setFontSize(10);
    const splitContent = doc.splitTextToSize(data.content || "No content provided.", 170);
    doc.text(splitContent, 20, 110);
    doc.text("This is an electronically generated document.", 105, 280, { align: "center" });
    doc.text("Savola Group - Quality Control Department", 105, 285, { align: "center" });

    const pdfBlob = doc.output("blob");

    // --- PRODUCTION FIX: Handle Missing Firebase Gracefully ---
    if (!storage) {
      console.warn("Firebase Storage not initialized. Falling back to local download.");
      
      // Create a local link and trigger a browser download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Return the local object URL so the UI doesn't break, 
      // though it won't be a permanent "cloud" link.
      return url;
    }

    try {
      // Normal Cloud Upload Path
      const storageRef = ref(storage, `certificates/${certId}.pdf`);
      await uploadBytes(storageRef, pdfBlob);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error("Firebase upload failed:", error);
      throw new Error("Failed to upload certificate to cloud storage.");
    }
  },
};