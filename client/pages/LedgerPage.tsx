import React, { useState, useMemo } from "react";
import { Search, CreditCard, Plus, CheckCircle2, AlertCircle, Calendar, ArrowRight, X, Percent } from "lucide-react";
import { useAppState, Order, PaymentLedger, PaymentEntry } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";

export const LedgerPage: React.FC = () => {
  const { payments, addPayment, togglePaymentComplete, orders, hasWritePermission } = useAppState();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const canWrite = hasWritePermission("Ledger");

  // Selected Order Ledger details for Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Form State
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const activeLedger = useMemo(() => {
    if (!selectedOrderId) return null;
    return payments.find(p => p.orderId === selectedOrderId) || { orderId: selectedOrderId, entries: [], isComplete: false };
  }, [payments, selectedOrderId]);

  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // enrich payments data with order details and calculations
  const enrichedLedgers = useMemo(() => {
    return payments.map(ledger => {
      const order = orders.find(o => o.id === ledger.orderId);
      const totalPaid = ledger.entries.reduce((sum, entry) => sum + entry.amount, 0);
      const orderVal = 350000; // Mock base order value of 3.5L
      const balance = Math.max(0, orderVal - totalPaid);
      const isCompleteComputed = ledger.isComplete || balance === 0;

      return {
        ...ledger,
        companyName: order?.companyName || "Unknown Client",
        city: order?.city || "Unknown",
        orderVal,
        totalPaid,
        balance,
        isCompleteComputed
      };
    });
  }, [payments, orders]);

  // Aggregate stats
  const totals = useMemo(() => {
    const totalCollected = enrichedLedgers.reduce((sum, el) => sum + el.totalPaid, 0);
    const totalExpected = enrichedLedgers.reduce((sum, el) => sum + el.orderVal, 0);
    const totalOutstanding = enrichedLedgers.reduce((sum, el) => sum + el.balance, 0);
    const collectionPercent = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    return {
      totalCollected,
      totalOutstanding,
      totalExpected,
      collectionPercent
    };
  }, [enrichedLedgers]);

  const filteredLedgers = useMemo(() => {
    return enrichedLedgers.filter(el => {
      const matchSearch = `${el.orderId} ${el.companyName} ${el.city}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" ||
        (statusFilter === "Complete" && el.isCompleteComputed) ||
        (statusFilter === "Pending" && !el.isCompleteComputed);
      return matchSearch && matchStatus;
    });
  }, [enrichedLedgers, search, statusFilter]);

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !payAmount) return;

    addPayment(selectedOrderId, Number(payAmount), payNote || "Partial Payment");
    setPayAmount("");
    setPayNote("");
  };

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold text-[#58705c] uppercase tracking-wider">Financial Accounts</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#15251f] mt-1">Payment Ledger</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor order payments ledger balances, log partial receipts, and track collection efficiency.
        </p>
      </div>

      {/* Aggregate Stats widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cash Collected</span>
          <p className="text-2xl font-bold text-emerald-800">₹{totals.totalCollected.toLocaleString()}</p>
          <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2.5 overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${totals.collectionPercent}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Accounts</span>
          <p className="text-2xl font-bold text-amber-800">₹{totals.totalOutstanding.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Pending invoices collection balance</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collection Ratio</span>
          <div className="flex items-center gap-1">
            <p className="text-2xl font-bold text-[#173c2d]">{totals.collectionPercent}%</p>
            <Percent size={18} className="text-[#173c2d]" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Received vs. Total Order Values ratio</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID, company, or location..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#5b8d65]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-600 outline-none focus:border-[#5b8d65] cursor-pointer"
        >
          <option value="All">All Ledgers</option>
          <option value="Complete">Paid / Complete</option>
          <option value="Pending">Payment Pending</option>
        </select>
      </div>

      {/* Table / Cards */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Client Company</th>
                <th className="px-5 py-3.5">Order Value</th>
                <th className="px-5 py-3.5">Collected</th>
                <th className="px-5 py-3.5">Outstanding Balance</th>
                <th className="px-5 py-3.5">Payment Status</th>
                <th className="px-5 py-3.5 text-center">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedgers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">No payment ledgers registered.</td>
                </tr>
              ) : (
                filteredLedgers.map(el => (
                  <tr key={el.orderId} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{el.orderId}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{el.companyName}</td>
                    <td className="px-5 py-4 text-slate-700 text-sm">₹{el.orderVal.toLocaleString()}</td>
                    <td className="px-5 py-4 text-emerald-700 font-bold text-sm">₹{el.totalPaid.toLocaleString()}</td>
                    <td className="px-5 py-4 text-slate-800 font-bold text-sm">
                      <span className={el.balance > 0 ? "text-amber-800" : "text-emerald-700"}>
                        ₹{el.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {el.isCompleteComputed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          <span>Fully Received</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                          <AlertCircle size={12} />
                          <span>Partial Collection</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setSelectedOrderId(el.orderId)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#173c2d] hover:underline"
                      >
                        <span>View Ledger File</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredLedgers.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 italic">No payment ledgers.</div>
          ) : (
            filteredLedgers.map(el => (
              <div key={el.orderId} className="p-4 space-y-3 hover:bg-slate-50/50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{el.companyName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Order ID: {el.orderId}</p>
                  </div>
                  {el.isCompleteComputed ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Pending
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 border p-2.5 rounded-xl bg-slate-50 text-[11px] text-center font-medium">
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Expected</span>
                    <span className="text-slate-800">₹{el.orderVal.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Received</span>
                    <span className="text-emerald-700">₹{el.totalPaid.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Outstanding</span>
                    <span className={el.balance > 0 ? "text-amber-800" : "text-emerald-700"}>₹{el.balance.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrderId(el.orderId)}
                  className="w-full bg-[#173c2d]/10 hover:bg-[#173c2d]/20 text-[#173c2d] py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <span>Manage Receipts Ledger</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* LEDGER DETAILS DIALOG */}
      {selectedOrderId && activeLedger && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">Receipts Ledger File</h3>
                <p className="text-xs text-slate-500">Order ID: {selectedOrderId} · {activeOrder?.companyName}</p>
              </div>
              <button onClick={() => setSelectedOrderId(null)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Payment details list */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Transaction Records</span>
                  {canWrite && (
                    <button
                      onClick={() => togglePaymentComplete(selectedOrderId)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition ${
                        activeLedger.isComplete
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      }`}
                    >
                      <span>{activeLedger.isComplete ? "Override: Complete" : "Override: Pending"}</span>
                    </button>
                  )}
                </div>

                {activeLedger.entries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 border rounded-lg">No transactions logged for this ledger yet.</p>
                ) : (
                  <div className="border rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                    {activeLedger.entries.map(entry => (
                      <div key={entry.id} className="p-3 text-xs flex justify-between items-center hover:bg-slate-50/50 transition">
                        <div>
                          <p className="font-bold text-slate-800">₹{entry.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">{entry.note || "No comments"}</p>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar size={11} />
                          <span>{entry.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Payment form */}
              {canWrite && (
                <form onSubmit={handleAddPaymentSubmit} className="space-y-3.5 border-t pt-3.5">
                  <h4 className="text-xs font-bold text-slate-700">Log New Payment Entry</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                      Amount Received (₹) <span className="text-rose-500">*</span>
                      <input
                        type="number"
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        placeholder="e.g. 75000"
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                        required
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                      Reference / Notes
                      <input
                        value={payNote}
                        onChange={e => setPayNote(e.target.value)}
                        placeholder="e.g. Bank Transfer ID: 8104"
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                      />
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs py-1.5 px-4 rounded-lg">
                      Log Entry
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
              <Button onClick={() => setSelectedOrderId(null)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                Close File
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
