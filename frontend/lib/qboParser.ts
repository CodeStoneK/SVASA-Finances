export interface ParsedQBOTransaction {
  type: 'Revenue' | 'Expense' | 'Transfer';
  date: string;
  amount: number;
  fitid: string; // bank_transaction_id
  description: string;
  qbo_account_id: string | null;
}

export function parseQBO(fileContent: string): ParsedQBOTransaction[] {
  const transactions: ParsedQBOTransaction[] = [];
  
  // Try to find the account number from the top of the file
  const acctIdMatch = fileContent.match(/<ACCTID>([^<\n\r]+)/i);
  const qbo_account_id = acctIdMatch ? acctIdMatch[1].trim() : null;

  // QBO/OFX files contain <STMTTRN>...</STMTTRN> blocks for each transaction.
  const blockRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  
  while ((match = blockRegex.exec(fileContent)) !== null) {
    const block = match[1];
    
    // Extract fields (matching anything up to next `<` or newline)
    const extract = (tag: string) => {
      const regex = new RegExp(`<${tag}>([^<\\n\\r]+)`, 'i');
      const res = block.match(regex);
      return res ? res[1].trim() : '';
    };

    const trnType = extract('TRNTYPE'); // CREDIT, DEBIT, XFER, etc
    const dtPosted = extract('DTPOSTED'); // e.g., 20250115120000.000[-5:EST]
    const trnAmt = extract('TRNAMT'); // e.g., -15.50
    const fitid = extract('FITID'); // unique bank ID
    const name = extract('NAME');
    const memo = extract('MEMO');

    if (!dtPosted || !trnAmt || !fitid) continue;

    // Date format usually YYYYMMDD
    const datePart = dtPosted.substring(0, 8);
    const date = `${datePart.substring(0, 4)}-${datePart.substring(4, 6)}-${datePart.substring(6, 8)}`;

    const rawAmount = parseFloat(trnAmt);
    if (isNaN(rawAmount)) continue;

    let amount = Math.abs(rawAmount);
    let type: 'Revenue' | 'Expense' | 'Transfer' = rawAmount < 0 ? 'Expense' : 'Revenue';
    
    // Attempt to detect Transfers
    const descText = [name, memo].filter(Boolean).join(' - ').toUpperCase();
    if (trnType.toUpperCase() === 'XFER' || descText.includes('TRANSFER')) {
      type = 'Transfer';
      amount = rawAmount; // Keep the sign so we know if it was IN or OUT!
    }

    const description = [name, memo].filter(Boolean).join(' - ');

    transactions.push({
      type,
      date,
      amount,
      fitid,
      description,
      qbo_account_id
    });
  }

  return transactions;
}
