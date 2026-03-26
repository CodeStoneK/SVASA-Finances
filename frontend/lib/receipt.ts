import type { Devotee, Donation, PaymentMethod } from "./types";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";

/**
 * Generates a donation receipt PDF matching the SVASA template.
 * Layout: Letter-size (612x792pt), formal style with centered header.
 */
export async function generateReceipt(
  donation: Donation,
  devotee: Devotee,
  serialNumber: number
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter", // 612 x 792
  });

  const pageWidth = 612;
  const leftMargin = 60;
  const labelX = 60;
  const valueX = 120;
  let y = 60;

  // --- Header (centered) ---
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text(
    "Sri Venkateswara Annamacharya Society of America (SVASA)",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 22;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text(
    "(A Non-Profit Organization EIN #33-0723974)",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 18;
  doc.text(
    "17707 Kensington Ave, Cerritos, CA 90703",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // --- Date and Serial Number row ---
  y += 40;
  doc.setFont("times", "bold");
  doc.setFontSize(12);

  const dateStr = formatReceiptDate(donation.donation_date);
  doc.text(`Date: ${dateStr}`, leftMargin, y);
  doc.text(
    `Serial No. ${serialNumber}`,
    pageWidth - leftMargin,
    y,
    { align: "right" }
  );

  // --- Body ---
  y += 35;
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text("Received with thanks a donation of", leftMargin, y);

  // Amount line
  y += 30;
  doc.setFont("times", "normal");
  const amountStr = formatAmount(Number(donation.amount));
  const paymentDetail = formatPaymentDetail(
    donation.payment_method,
    donation.instrument_number
  );
  doc.text("Amount:", labelX, y);
  doc.text(`${amountStr}${paymentDetail}`, valueX, y);

  // From line
  y += 30;
  const acknowledgeName =
    devotee.name_to_acknowledge ||
    `${devotee.first_name} ${devotee.last_name}`;
  doc.text("From:", labelX + 10, y);
  doc.text(acknowledgeName, valueX, y);

  // Address lines
  y += 30;
  doc.text("Address:", labelX - 3, y);
  if (devotee.address_line1) {
    doc.text(devotee.address_line1, valueX, y);
    y += 18;
    const cityLine = [devotee.city, devotee.state]
      .filter(Boolean)
      .join(", ");
    const fullLine = [cityLine, devotee.zip_code].filter(Boolean).join("  ");
    if (fullLine) {
      doc.text(fullLine, valueX, y);
    }
  } else {
    doc.text("On file", valueX, y);
  }

  // --- Blessing ---
  y += 45;
  doc.setFont("times", "italic");
  doc.text(
    "May the blessing of Sri Venkateswara and Annamacharya be with you, always.",
    leftMargin + 20,
    y
  );

  // --- Signature area ---
  y += 50;
  doc.setFont("times", "normal");
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(leftMargin, y, leftMargin + 120, y); // signature line

  y += 18;
  doc.text("(SVASA)", leftMargin + 10, y);

  return doc;
}

/**
 * Generate and trigger download of a receipt PDF.
 */
export async function downloadReceipt(
  donation: Donation,
  devotee: Devotee,
  serialNumber: number
): Promise<void> {
  try {
    const doc = await generateReceipt(donation, devotee, serialNumber);
    const fileName = buildFileName(devotee, donation.donation_date);
    
    // Create blob representing the PDF
    const blob = doc.output("blob");
    
    // Use file-saver to flawlessly handle Blob URL and correct filename forcing
    saveAs(blob, fileName);
  } catch (error) {
    console.error("Error generating or downloading receipt:", error);
    throw error;
  }
}

/**
 * Generate receipt and return as Blob for preview or upload.
 */
export async function generateReceiptBlob(
  donation: Donation,
  devotee: Devotee,
  serialNumber: number
): Promise<Blob> {
  const doc = await generateReceipt(donation, devotee, serialNumber);
  return doc.output("blob");
}

// --- Helpers ---

function formatReceiptDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function formatAmount(amount: number): string {
  return "$" + amount.toFixed(2);
}

function formatPaymentDetail(
  method: PaymentMethod | string,
  instrumentNumber: string | null
): string {
  if (method === "Check" && instrumentNumber) {
    // Extract just the number from references like "CHK-10234"
    const num = instrumentNumber.replace(/^CHK-?/i, "");
    return ` (Check ${num})`;
  }
  if (method === "Cash") return " (Cash)";
  if (instrumentNumber) return ` (${method} ${instrumentNumber})`;
  return ` (${method})`;
}

function buildFileName(devotee: Devotee, dateStr: string): string {
  const name = `${devotee.last_name}_${devotee.first_name}`.replace(
    /[^a-zA-Z0-9_]/g,
    ""
  );
  return `Donation_Receipt_${name}_${dateStr}.pdf`;
}
