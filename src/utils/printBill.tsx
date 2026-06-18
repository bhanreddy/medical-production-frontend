import { renderToStaticMarkup } from 'react-dom/server';
import { BillPrintLayout, type BillPrintLayoutProps } from '../components/Billing/BillPrintLayout';

/**
 * UTILITY: printBill
 * Renders a thermal receipt in an off-screen iframe and opens the browser print dialog.
 */

const PRINT_STYLES = `
  @page {
    size: auto;
    margin: 4mm;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 80mm;
    background: #fff;
    color: #000;
    font-family: 'Courier New', Courier, monospace;
    font-size: 10px;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  #print-root {
    width: 80mm;
    padding: 3mm;
  }

  .bill-print-root {
    max-width: 78mm;
    margin: 0 auto;
    color: #000 !important;
    background: #fff !important;
    font-family: 'Courier New', Courier, monospace;
    line-height: 1.35;
    padding: 4mm;
  }

  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .items-start { align-items: flex-start; }
  .items-end { align-items: flex-end; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .justify-end { justify-content: flex-end; }
  .w-full { width: 100%; }

  .gap-1 { gap: 2px; }
  .p-4 { padding: 4mm; }
  .px-1 { padding-left: 2px; padding-right: 2px; }
  .px-2 { padding-left: 4px; padding-right: 4px; }
  .py-1 { padding-top: 2px; padding-bottom: 2px; }
  .py-2 { padding-top: 4px; padding-bottom: 4px; }
  .pt-2 { padding-top: 4px; }
  .pb-1 { padding-bottom: 2px; }
  .pr-1 { padding-right: 2px; }
  .mt-0\\.5 { margin-top: 1px; }
  .mt-1 { margin-top: 2px; }
  .mt-2 { margin-top: 4px; }
  .mt-4 { margin-top: 8px; }
  .mb-1 { margin-bottom: 2px; }
  .mb-2 { margin-bottom: 4px; }
  .mb-4 { margin-bottom: 8px; }
  .mb-6 { margin-bottom: 12px; }
  .mr-2 { margin-right: 4px; }
  .mx-auto { margin-left: auto; margin-right: auto; }

  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-black { color: #000; }
  .text-3xl { font-size: 18px; line-height: 1.1; }
  .text-xl { font-size: 16px; line-height: 1.2; }
  .text-lg { font-size: 14px; line-height: 1.3; }
  .text-sm { font-size: 10px; line-height: 1.35; }
  .text-xs { font-size: 9px; line-height: 1.3; }
  .text-\\[10px\\] { font-size: 10px; line-height: 1.3; }
  .text-\\[8px\\] { font-size: 8px; line-height: 1.2; }

  .font-black { font-weight: 900; }
  .font-bold { font-weight: 700; }
  .font-medium { font-weight: 500; }
  .font-normal { font-weight: 400; }
  .font-sans { font-family: 'Courier New', Courier, monospace; }
  .uppercase { text-transform: uppercase; }
  .capitalize { text-transform: capitalize; }
  .italic { font-style: italic; }
  .leading-none { line-height: 1; }
  .leading-tight { line-height: 1.2; }
  .tracking-wide { letter-spacing: 0.04em; }
  .tracking-wider { letter-spacing: 0.08em; }
  .tracking-widest { letter-spacing: 0.12em; }

  .opacity-10 { opacity: 0.1; }
  .opacity-70 { opacity: 0.7; }
  .bg-white { background: #fff; }

  .border-b { border-bottom: 1px solid #000; }
  .border-t { border-top: 1px solid #000; }
  .border-black { border-color: #000; }

  .space-y-0\\.5 > * + * { margin-top: 1px; }
  .space-y-1 > * + * { margin-top: 2px; }
  .space-y-3 > * + * { margin-top: 6px; }

  .w-5 { width: 14px; }
  .w-8 { width: 24px; }
  .w-10 { width: 32px; }
  .w-12 { width: 40px; }
  .w-\\[60\\%\\] { width: 60%; }
  .max-h-\\[60px\\] { max-height: 60px; }
  .object-contain { object-fit: contain; }
  .grayscale { filter: grayscale(100%); }

  .align-bottom { vertical-align: bottom; }
  .align-top { vertical-align: top; }

  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 9px;
    line-height: 1.3;
  }

  th, td {
    padding: 1px 2px;
    vertical-align: top;
    color: #000;
  }

  th {
    font-weight: 700;
    border-bottom: 1px solid #000;
  }

  h1, p, span, div, td, th {
    color: #000;
  }

  @media print {
    html, body, #print-root, .bill-print-root {
      width: 80mm;
      background: #fff !important;
      color: #000 !important;
    }
  }
`;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const printBill = (props: BillPrintLayoutProps) => {
  const markup = renderToStaticMarkup(<BillPrintLayout {...props} />);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Bill print');
  iframe.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    'width:80mm',
    'height:auto',
    'border:0',
    'overflow:visible',
  ].join(';');
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    console.error('[printBill] Failed to access iframe document');
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${props.invoiceNumber}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <div id="print-root">${markup}</div>
</body>
</html>`);
  doc.close();

  const cleanup = () => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  };

  const triggerPrint = async () => {
    await wait(120);

    const images = Array.from(doc.images);
    await Promise.all(
      images.map(
        img =>
          new Promise<void>(resolve => {
            if (img.complete) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    );

    win.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(cleanup, 60_000);

    win.focus();
    win.print();
  };

  void triggerPrint();
};
