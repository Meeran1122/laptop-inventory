import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, X } from 'lucide-react';
import Button from '../common/Button';
import type { Sale } from '../../types/stock';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface InvoiceModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export default function InvoiceModal({ sale, onClose }: InvoiceModalProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice-${sale?.id}`,
  });

  if (!sale) return null;

  // Calculate unit price and total just to be sure
  const unitPrice = Number(sale.selling_price);
  const total = Number(sale.total_amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        
        {/* Header (Not Printed) */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Invoice Preview</h2>
          <div className="flex gap-2">
            <Button onClick={() => handlePrint()} className="gap-2">
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </Button>
            <Button variant="secondary" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Content (This gets printed) */}
        <div className="overflow-y-auto p-8 flex-1">
          <div ref={componentRef} className="print:p-8 text-slate-900">
            
            {/* Logo & Store Info */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
              <div>
                <h1 className="text-3xl font-bold uppercase tracking-tight">Laptop Store</h1>
                <p className="text-sm text-slate-600 mt-1">123 Tech Avenue, Lahore, Pakistan</p>
                <p className="text-sm text-slate-600">Phone: +92 300 1234567</p>
                <p className="text-sm text-slate-600">Email: support@laptopstore.com</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-slate-400 uppercase">Invoice</h2>
                <p className="text-sm font-medium mt-2">Invoice #: INV-{sale.id.toString().padStart(5, '0')}</p>
                <p className="text-sm text-slate-600">Date: {formatDate(sale.sale_date)}</p>
              </div>
            </div>

            {/* Billed To */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Billed To:</h3>
              <p className="font-medium">Walk-in Customer</p>
            </div>

            {/* Table */}
            <table className="w-full text-left mb-8">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-2 text-sm font-bold text-slate-600">Item Description</th>
                  <th className="py-2 text-sm font-bold text-slate-600 text-center">Qty</th>
                  <th className="py-2 text-sm font-bold text-slate-600 text-right">Unit Price</th>
                  <th className="py-2 text-sm font-bold text-slate-600 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-4">
                    <p className="font-medium text-slate-900">{sale.product_name}</p>
                  </td>
                  <td className="py-4 text-center">{sale.quantity}</td>
                  <td className="py-4 text-right">{formatCurrency(unitPrice)}</td>
                  <td className="py-4 text-right font-medium">{formatCurrency(total)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
              <div className="w-64">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-600">Tax (0%):</span>
                  <span className="font-medium">Rs. 0</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-slate-900 text-lg font-bold">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-slate-500 border-t border-slate-200 pt-6">
              <p className="font-medium">Thank you for your business!</p>
              <p className="mt-1">This is a computer-generated invoice. No signature required.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}