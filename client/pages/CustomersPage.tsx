import React, { useState, useMemo } from "react";
import { Search, Plus, Edit3, Trash2, ArrowRight, X, Users, MapPin } from "lucide-react";
import { useAppState, Customer } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const CustomersPage: React.FC = () => {
  const {
    customers,
    orders,
    complaints,
    cities,
    saveCustomerMaster,
    deleteCustomerMaster,
    hasWritePermission
  } = useAppState();

  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const canWrite = hasWritePermission("Customers");

  // Modal open states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Customer | null>(null);
  const [selectedCustDetails, setSelectedCustDetails] = useState<Customer | null>(null);
  const [selectedBranchProfile, setSelectedBranchProfile] = useState<string | null>(null);

  const displayDetails = useMemo(() => {
    if (!selectedCustDetails) return null;
    if (!selectedBranchProfile) return selectedCustDetails;
    
    const bDetail = selectedCustDetails.branchDetails?.find(b => b.name === selectedBranchProfile);
    return {
      ...selectedCustDetails,
      contactPerson: bDetail?.contactPerson || selectedCustDetails.contactPerson,
      phone: bDetail?.phone || selectedCustDetails.phone,
      address: bDetail?.address || selectedCustDetails.address,
    };
  }, [selectedCustDetails, selectedBranchProfile]);

  // --- Dynamic Form States ---
  const [custId, setCustId] = useState("");
  const [custName, setCustName] = useState("");
  const [custContact, setCustContact] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custCity, setCustCity] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custBranches, setCustBranches] = useState("");
  const [custGstNumber, setCustGstNumber] = useState("");

  const resetForms = () => {
    setCustId("");
    setCustName("");
    setCustContact("");
    setCustPhone("");
    setCustCity("");
    setCustAddress("");
    setCustBranches("");
    setCustGstNumber("");
    setEditingItem(null);
    setIsAddOpen(false);
  };

  const handleEditClick = (item: Customer) => {
    setEditingItem(item);
    setCustId(item.id);
    setCustName(item.name);
    setCustContact(item.contactPerson || "");
    setCustPhone(item.phone || "");
    setCustCity(item.city || "");
    setCustAddress(item.address || "");
    setCustBranches(item.branches ? item.branches.join(", ") : "");
    setCustGstNumber(item.gstNumber || "");
    setIsAddOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!canWrite) return;
    if (!confirm("Are you sure you want to delete this customer record?")) return;
    await deleteCustomerMaster(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    const data: Customer = {
      id: custId || `C-${Date.now()}`,
      name: custName,
      contactPerson: custContact || undefined,
      phone: custPhone || undefined,
      city: custCity || undefined,
      address: custAddress || undefined,
      branches: custBranches ? custBranches.split(",").map(b => b.trim()).filter(Boolean) : [],
      gstNumber: custGstNumber || undefined
    };
    await saveCustomerMaster(data);
    resetForms();
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [customers, search]);

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-xs font-semibold text-[#58705c] uppercase tracking-wider">Operational Masters</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#15251f] mt-1">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your registered customer accounts, contact details, operational branches, and GIDC locations.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setIsAddOpen(true)} className="bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center gap-2 rounded-xl py-5 shadow-sm">
            <Plus size={16} />
            <span>Add Customer</span>
          </Button>
        )}
      </div>

      {/* Search Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers by name, city, or phone..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#5b8d65]"
          />
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5 hidden sm:table-cell">Customer ID</th>
                <th className="px-5 py-3.5">Company Name</th>
                <th className="px-5 py-3.5">Contact Person</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5 hidden sm:table-cell">City Location</th>
                {canWrite && <th className="px-5 py-3.5 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(c => (
                <tr 
                  key={c.id} 
                  onClick={() => { setSelectedCustDetails(c); setSelectedBranchProfile(null); }} 
                  className="hover:bg-slate-50/50 transition text-sm cursor-pointer"
                >
                  <td className="px-6 py-4 font-bold text-slate-700 hidden sm:table-cell">{c.id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    <div className="flex flex-col">
                      <span>{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium truncate max-w-[280px]">{c.address}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{c.contactPerson || "N/A"}</td>
                  <td className="px-5 py-4 text-slate-600 font-medium">{c.phone || "N/A"}</td>
                  <td className="px-5 py-4 text-slate-600 hidden sm:table-cell">{c.city || "N/A"}</td>
                  {canWrite && (
                    <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => navigate(`/orders?search=${c.name}`)}
                          className="inline-flex items-center gap-0.5 text-xs text-[#173c2d] font-bold hover:underline"
                        >
                          <span>Orders</span>
                          <ArrowRight size={12} />
                        </button>
                        <button onClick={() => handleEditClick(c)} className="text-slate-400 hover:text-slate-750 p-0.5"><Edit3 size={15} /></button>
                        <button onClick={() => handleDeleteItem(c.id)} className="text-slate-400 hover:text-red-500 p-0.5"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-sm italic">
                    No customers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT DIALOG */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {editingItem ? "Edit Customer Record" : "Add Customer Record"}
              </h3>
              <button onClick={resetForms} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                  Customer ID
                  <input value={custId} onChange={e => setCustId(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" placeholder="e.g. C-101 (or auto-generated)" />
                </label>
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                  Company Name
                  <input value={custName} onChange={e => setCustName(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" required />
                </label>
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                  Contact Person Name
                  <input value={custContact} onChange={e => setCustContact(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                </label>
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                  Contact Phone
                  <input value={custPhone} onChange={e => setCustPhone(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                </label>
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                  City Location
                  <select value={custCity} onChange={e => setCustCity(e.target.value)} className="rounded border bg-white px-3 py-2 text-sm outline-none">
                    <option value="">Select City (Optional)</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                  Corporate Address
                  <textarea value={custAddress} onChange={e => setCustAddress(e.target.value)} className="rounded border p-2.5 text-sm outline-none min-h-[60px]" />
                </label>
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                  GST Number (Optional)
                  <input value={custGstNumber} onChange={e => setCustGstNumber(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none uppercase" />
                </label>
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                  Branches (comma-separated, e.g. Head Office, GIDC Phase II)
                  <input value={custBranches} onChange={e => setCustBranches(e.target.value)} placeholder="Main, Branch A" className="rounded border px-3 py-2 text-sm outline-none" />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                <Button type="button" onClick={resetForms} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                  Cancel
                </Button>
                {canWrite && (
                  <Button type="submit" className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4">
                    Save Changes
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAILS DIALOG */}
      {selectedCustDetails && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between bg-slate-50">
              <div>
                <p className="text-xs font-semibold text-[#58705c] uppercase tracking-wider">Customer Profile</p>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {selectedCustDetails.name}
                </h3>
              </div>
              <button onClick={() => { setSelectedCustDetails(null); setSelectedBranchProfile(null); }} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Customer Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Customer ID</span>
                  <span className="font-semibold text-slate-800">{selectedCustDetails.id}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Contact Person</span>
                  <span className="font-semibold text-slate-800">{displayDetails?.contactPerson || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Phone Number</span>
                  <span className="font-semibold text-slate-800">{displayDetails?.phone || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">City / Location</span>
                  <span className="font-semibold text-slate-800">{displayDetails?.city || "N/A"}</span>
                </div>
                {selectedCustDetails.gstNumber && (
                  <div className="col-span-2">
                    <span className="block text-xs font-bold text-slate-400 uppercase">GST Number</span>
                    <span className="font-semibold text-slate-800 uppercase">{selectedCustDetails.gstNumber}</span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Registered Address</span>
                  <span className="text-slate-700">{displayDetails?.address || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Registered Branches</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedCustDetails.branches && selectedCustDetails.branches.map(br => (
                      <span 
                        key={br} 
                        onClick={() => setSelectedBranchProfile(selectedBranchProfile === br ? null : br)}
                        className={`text-xs px-2.5 py-0.5 rounded border cursor-pointer ${selectedBranchProfile === br ? 'bg-[#173c2d] text-white border-[#173c2d]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        {br}
                      </span>
                    ))}
                    {(!selectedCustDetails.branches || selectedCustDetails.branches.length === 0) && (
                      <span className="text-xs text-slate-400 italic">No custom branches added</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Complaints Logged</span>
                  <span className="inline-flex items-center gap-1.5 mt-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {complaints.filter(c => c.companyName.toLowerCase() === selectedCustDetails.name.toLowerCase()).length} complaints
                  </span>
                </div>
              </div>

              {/* Customer Orders list */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order History & Placement</h4>
                {(() => {
                  const custOrders = orders.filter(
                    o => o.customerId === selectedCustDetails.id || o.companyName.toLowerCase() === selectedCustDetails.name.toLowerCase()
                  );
                  if (custOrders.length === 0) {
                    return <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border">No orders placed by this customer yet.</p>;
                  }
                  return (
                    <div className="space-y-2">
                      {custOrders.map(order => (
                        <div
                          key={order.id}
                          onClick={() => {
                            navigate(`/orders?orderId=${order.id}&search=${order.id}`);
                          }}
                          className="flex flex-col p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="font-bold text-sm text-slate-900 hover:text-[#173c2d]">{order.id}</span>
                              <div className="flex gap-2 text-xs text-slate-500">
                                <span>Branch: <strong className="text-slate-750">{order.branch || "Main"}</strong></span>
                                <span>•</span>
                                <span>Value: <strong className="text-slate-750 font-bold">₹{(order.orderValue || 0).toLocaleString()}</strong></span>
                              </div>
                            </div>
                            <span className={`text-[11px] font-bold border px-2 py-0.5 rounded-full ${
                                order.status === "Commissioned/Completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                                  : order.status === "Payment Pending"
                                  ? "bg-sky-50 text-sky-700 border-sky-200"
                                  : "bg-slate-50 text-slate-750 border-slate-205"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          {order.productsSelected && order.productsSelected.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {order.productsSelected.map((prod, idx) => (
                                <span key={idx} className="bg-[#173c2d]/10 text-[#173c2d] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#173c2d]/20">
                                  {prod.productName} ({prod.quantity})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end border-t p-4 bg-slate-50">
              <Button type="button" onClick={() => { setSelectedCustDetails(null); setSelectedBranchProfile(null); }} className="bg-slate-800 hover:bg-slate-750 text-white text-xs rounded-lg px-4">
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
