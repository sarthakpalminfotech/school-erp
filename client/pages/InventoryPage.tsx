import React, { useState, useMemo } from "react";
import { Search, Plus, Box, AlertTriangle, ShieldCheck, Check, X } from "lucide-react";
import { useAppState, Part } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";

export const InventoryPage: React.FC = () => {
  const { inventory, addInventoryStock, hasWritePermission } = useAppState();
  const [search, setSearch] = useState("");

  // Add stock state
  const [selectedPartId, setSelectedPartId] = useState("");
  const [stockToAdd, setStockToAdd] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const canWrite = hasWritePermission("Inventory");

  const filteredInventory = useMemo(() => {
    return inventory.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [inventory, search]);

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId || !stockToAdd) return;

    addInventoryStock(selectedPartId, Number(stockToAdd));
    setSelectedPartId("");
    setStockToAdd("");
    setIsAddOpen(false);
  };

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-xs font-semibold text-[#58705c] uppercase tracking-wider">Warehouse Management</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#15251f] mt-1">Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor compressor spare parts stock, log restock inputs, and track threshold alarms.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setIsAddOpen(true)} className="bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center gap-2 rounded-xl py-5 shadow-sm">
            <Plus size={16} />
            <span>Restock Inventory</span>
          </Button>
        )}
      </div>

      {/* Low stock warning banner */}
      {inventory.some(p => p.quantity <= p.threshold) && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 shadow-sm animate-fadeIn">
          <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Low Stock Warning:</span> Some critical parts have fallen below their threshold level. Please restock immediately to avoid service dispatch delays.
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search spare parts by name..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#5b8d65]"
          />
        </div>
      </div>

      {/* Listing (Table for desktop, Cards for mobile) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Part ID</th>
                <th className="px-5 py-3.5">Part Name</th>
                <th className="px-5 py-3.5">Quantity in Warehouse</th>
                <th className="px-5 py-3.5">Low-Stock Alert Level</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No parts found in stock.</td>
                </tr>
              ) : (
                filteredInventory.map(part => {
                  const isLow = part.quantity <= part.threshold;
                  return (
                    <tr key={part.id} className={`hover:bg-slate-50/50 transition ${isLow ? "bg-red-50/30" : ""}`}>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm">{part.id}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{part.name}</td>
                      <td className="px-5 py-4 font-bold text-slate-800 text-sm">
                        <span className={isLow ? "text-red-700" : "text-slate-800"}>{part.quantity} units</span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        Alert threshold at {part.threshold} units
                      </td>
                      <td className="px-5 py-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 border border-red-200">
                            <AlertTriangle size={12} />
                            <span>Low Stock Alert</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                            <Check size={12} />
                            <span>Sufficient Stock</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredInventory.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 italic">No parts found.</div>
          ) : (
            filteredInventory.map(part => {
              const isLow = part.quantity <= part.threshold;
              return (
                <div key={part.id} className={`p-4 space-y-3 hover:bg-slate-50/50 transition ${isLow ? "bg-red-50/20" : ""}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{part.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Part ID: {part.id}</p>
                    </div>
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 border border-red-200">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        In Stock
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1.5 border-t">
                    <span className="text-slate-500">Warehouse Stock: <strong>{part.quantity} units</strong></span>
                    <span className="text-slate-400 text-[10px]">Alert Limit: {part.threshold} units</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RESTOCK DIALOG */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">Restock Warehouse Parts</h3>
              <button onClick={() => setIsAddOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>

            <form onSubmit={handleAddStockSubmit}>
              <div className="p-5 space-y-4">
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Select Spare Part <span className="text-rose-500">*</span>
                  <select
                    value={selectedPartId}
                    onChange={e => setSelectedPartId(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                    required
                  >
                    <option value="">-- Select Spare --</option>
                    {inventory.map(part => (
                      <option key={part.id} value={part.id}>{part.name} (Current: {part.quantity} units)</option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Restock Amount (units) <span className="text-rose-500">*</span>
                  <input
                    type="number"
                    min="1"
                    value={stockToAdd}
                    onChange={e => setStockToAdd(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                    required
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                <Button type="button" onClick={() => setIsAddOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4">
                  Log Restock Input
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
