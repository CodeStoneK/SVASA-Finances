"use client";

import type { Devotee } from "./types";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";

interface DevoteeSummary {
  devotee: Devotee;
  totalAmount: number;
  donationCount: number;
}

const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export async function downloadAcknowledgementLetter(summary: DevoteeSummary, year: number) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: "letter",
    });

    // Set global font to Times Roman
    doc.setFont("times", "normal");

    // Load images
    const logoBase64 = await fetchImageAsBase64("/svasa_logo.jpeg");
    const signatureBase64 = await fetchImageAsBase64("/cfo_signature.jpeg");

    // --- Header ---
    // Logo
    doc.addImage(logoBase64, "JPEG", 0.6, 0.35, 1.0, 1.0);

    // Header Text
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text("Sri Venkateswara Annamacharya Society of America", 4.7, 0.6, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("(SVASA)", 4.7, 0.9, { align: "center" });
    
    doc.setFont("times", "italic");
    doc.setFontSize(12);
    // Note: The template actually has "(A Non-Profit Religious Organization registered in California, USA)" in bold italic
    // but jsPDF built-in times-bolditalic is 'bolditalic' font style
    doc.setFont("times", "bolditalic");
    doc.text("(A Non-Profit Religious Organization registered in California, USA)", 4.7, 1.2, { align: "center" });

    // Header Line
    doc.setLineWidth(0.02);
    doc.line(0.5, 1.4, 8.0, 1.4);

    // --- Left Sidebar ---
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    const leftMargin = 0.5;
    let currentY = 1.8;
    const lineHeight = 0.2;

    const boardMembers = [
      ["Satya V. Duvvuri", "Founder, Chair"],
      ["", ""],
      ["Venkateswara R.", "Kotha", "President/CEO"],
      ["", ""],
      ["Vasanth Tatta", "Vice President"],
      ["", ""],
      ["Rangaraya S.", "Komaragiri", "Treasurer/CFO", "Secretary"],
      ["", ""],
      ["Srinivas Hotha", "Asst. Treasurer"],
      ["", ""],
      ["Vijay K. Chemuturi", "CIO"],
      ["", ""],
      ["Paul DeSantis, Esq.", "Legal Advisor"],
    ];

    boardMembers.forEach(memberLines => {
      memberLines.forEach(line => {
        doc.text(line, leftMargin + 0.6, currentY, { align: "center" });
        currentY += lineHeight;
      });
    });

    // EID
    currentY += 0.5;
    doc.text("EID# 33-0723974", leftMargin + 0.6, currentY, { align: "center" });

    // --- Main Body (Right Column) ---
    const rightMargin = 2.2;
    let bodyY = 1.8;
    doc.setFont("times", "normal");
    doc.setFontSize(11);

    // Date
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    doc.text(`Date: ${formattedDate}`, rightMargin, bodyY);

    // To Address
    bodyY += 0.5;
    doc.text("To,", rightMargin, bodyY);
    bodyY += 0.4;
    
    const d = summary.devotee;
    const firstName = d.first_name || "";
    const middleName = d.middle_name ? ` ${d.middle_name}` : "";
    const lastName = d.last_name ? ` ${d.last_name}` : "";
    
    // For the letter, name_to_acknowledge is preferred, fallback to concatenated name.
    const addresseeName = d.name_to_acknowledge || `${firstName}${middleName}${lastName}`.trim();
    
    doc.text(addresseeName, rightMargin, bodyY);
    bodyY += 0.2;
    if (d.address_line1) {
      doc.text(d.address_line1, rightMargin, bodyY);
      bodyY += 0.2;
    }
    if (d.city || d.state || d.zip_code) {
      const csz = [d.city, d.state, d.zip_code].filter(Boolean).join(", ").replace(/, (\d{5})/, " $1");
      doc.text(csz, rightMargin, bodyY);
      bodyY += 0.2;
    }

    // Salutation
    bodyY += 0.5;
    doc.text(`Dear ${addresseeName},`, rightMargin, bodyY);

    // Paragraph 1
    bodyY += 0.4;
    const p1 = "Sri Venkateswara Annamacharya Society of America (SVASA) is a nonprofit organization dedicated to protect, preserve, and promote the literature, music, and philosophy of the 15th century saint composer Sri Tallapaka Annamacharya. SVASA has been honoring Sri Tallapaka Annamacharya by observing Annamacharya Jayanthi and Vardhanthi commemorations annually for the past three decades.";
    const p1Lines = doc.splitTextToSize(p1, 5.5);
    doc.text(p1Lines, rightMargin, bodyY);

    // Paragraph 2
    bodyY += p1Lines.length * lineHeight + 0.2;
    const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(summary.totalAmount);
    doc.text(`SVASA greatly appreciates your donation of ${formattedAmount} during the year of ${year} in support of the organization's activities.`, rightMargin, bodyY, { maxWidth: 5.5 });

    // Paragraph 3
    bodyY += 0.6;
    doc.text("May the blessings of Sri Venkateswara and Annamacharya be with you, always.", rightMargin, bodyY);

    // Sign off
    bodyY += 0.6;
    doc.text("Thank you.", rightMargin, bodyY);

    // Signature
    bodyY += 0.2;
    doc.addImage(signatureBase64, "JPEG", rightMargin, bodyY, 1.8, 0.6);

    bodyY += 0.7;
    doc.text("Rangaraya S. Komaragiri. /CFO", rightMargin, bodyY);

    // --- Footer ---
    doc.setLineWidth(0.02);
    doc.line(0.5, 10.2, 8.0, 10.2);

    doc.setFont("times", "bold");
    doc.text("Address: 17707 Kensington Ave, Cerritos, CA 90703", 4.25, 10.4, { align: "center" });
    
    doc.setFont("times", "bold");
    doc.setTextColor(0, 0, 255); // Blue link color
    doc.text("http://www.svasa.org", 1.5, 10.6);
    
    doc.setTextColor(0, 0, 0); // Black for "OR"
    doc.text("OR", 3.1, 10.6);
    
    doc.setTextColor(0, 0, 255);
    doc.text("http://www.annamacharya.org", 3.5, 10.6);
    
    doc.setTextColor(0, 0, 0);
    doc.text("email:", 5.7, 10.6);
    
    doc.setTextColor(0, 0, 255);
    doc.text("Sankeerthana@svasa.org", 6.2, 10.6);

    // Trigger download
    const safeName = addresseeName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `SVASA_Acknowledgement_${year}_${safeName}.pdf`;

    const blob = doc.output("blob");
    
    saveAs(blob, filename);

  } catch (error) {
    console.error("Error generating acknowledgement letter:", error);
    alert("Failed to generate PDF. Please try again.");
  }
}
