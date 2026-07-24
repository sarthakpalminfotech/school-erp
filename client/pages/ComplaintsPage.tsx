import React, { useState, useMemo } from "react";
import { Search, Plus, CircleHelp, User, MapPin, Check, X, Clock, AlertTriangle, ShieldCheck, ArrowRight, RotateCcw } from "lucide-react";
import { useAppState, Complaint, EmployeeMaster } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";

export const ComplaintsPage: React.FC = () => {
  const {
    complaints, assignComplaint, updateComplaintStatus, logComplaint,
    employees, orders, customers, currentUserRole, hasWritePermission
  } = useAppState();

  const canWrite = hasWritePermission("Complaints");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Log Complaint Modal
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logCustomerId, setLogCustomerId] = useState("");
  const [logCustomerSearch, setLogCustomerSearch] = useState("");
  const [logOrderId, setLogOrderId] = useState("");
  const [logIssue, setLogIssue] = useState("");
  const [logPhoto, setLogPhoto] = useState("");
  const [logVoiceNote, setLogVoiceNote] = useState("");

  // Assign Modal
  const [activeComplaintForAssign, setActiveComplaintForAssign] = useState<Complaint | null>(null);

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchSearch = `${c.id} ${c.companyName} ${c.city} ${c.issue}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [complaints, search, statusFilter]);

  // Compute nearby engineers based on same city
  const engineerGroup = useMemo(() => {
    if (!activeComplaintForAssign) return { nearby: [], others: [] };
    const compCity = activeComplaintForAssign.city;
    const engineers = employees.filter(e => e.role === "Service Engineer");
    
    return {
      nearby: engineers.filter(e => e.city.toLowerCase() === compCity.toLowerCase()),
      others: engineers.filter(e => e.city.toLowerCase() !== compCity.toLowerCase())
    };
  }, [activeComplaintForAssign, employees]);

  const handleLogComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logOrderId || !logIssue.trim()) return;

    logComplaint(logOrderId, logIssue, logPhoto, logVoiceNote);
    setLogCustomerId("");
    setLogCustomerSearch("");
    setLogOrderId("");
    setLogIssue("");
    setLogPhoto("");
    setLogVoiceNote("");
    setIsLogOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogVoiceNote(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAssignSubmit = (engineerName: string) => {
    if (!activeComplaintForAssign) return;
    assignComplaint(activeComplaintForAssign.id, engineerName);
    setActiveComplaintForAssign(null);
  };

  const getStatusColor = (status: Complaint["status"]) => {
    switch (status) {
      case "Open": return "bg-red-100 text-red-800 border-red-200";
      case "Assigned": return "bg-blue-100 text-blue-800 border-blue-200";
      case "In Progress": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Resolved/Closed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Reopened": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-xs font-semibold text-[#58705c] uppercase tracking-wider">Customer Support</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#15251f] mt-1">Complaints</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track machinery complaints, engineer assignments, and resolution statuses.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setIsLogOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 rounded-xl py-5 shadow-sm">
            <Plus size={16} />
            <span>Log New Complaint</span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company, city, issue..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#5b8d65]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-600 outline-none focus:border-[#5b8d65] cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved/Closed">Resolved/Closed</option>
          <option value="Reopened">Reopened</option>
        </select>
      </div>

      {/* List (Table for desktop, Cards for mobile) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Desktop view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Ticket Info</th>
                <th className="px-5 py-3.5">Client Location</th>
                <th className="px-5 py-3.5">Issue Reported</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Assigned Engineer</th>
                <th className="px-5 py-3.5 text-center">Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No complaint tickets logged.</td>
                </tr>
              ) : (
                filteredComplaints.map(comp => (
                  <tr key={comp.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-rose-600 text-sm">{comp.id}</div>
                      <div className="text-xs text-slate-500 font-semibold mt-0.5">{comp.companyName}</div>
                      <div className="text-[10px] text-slate-400">Order: {comp.orderId}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{comp.city}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-xs font-medium max-w-[200px] truncate" title={comp.issue}>
                      {comp.issue}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusColor(comp.status)}`}>
                        {comp.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {comp.assignedEngineer ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{comp.assignedEngineer}</span>
                          {comp.assignedAt && (
                            <span className="text-[9px] text-slate-400">Assigned: {new Date(comp.assignedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      ) : canWrite ? (
                        <button
                          onClick={() => setActiveComplaintForAssign(comp)}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded text-[11px] font-bold transition"
                        >
                          Assign Engineer
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        {canWrite ? (
                          <>
                            {comp.status === "Assigned" && (
                              <button
                                onClick={() => updateComplaintStatus(comp.id, "In Progress")}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border px-2 py-1 rounded text-[10px] font-bold"
                              >
                                Start Work
                              </button>
                            )}
                            {comp.status === "In Progress" && (
                              <button
                                onClick={() => updateComplaintStatus(comp.id, "Resolved/Closed")}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border px-2 py-1 rounded text-[10px] font-bold"
                              >
                                Resolve / Close
                              </button>
                            )}
                            {comp.status === "Resolved/Closed" && (
                              <button
                                onClick={() => updateComplaintStatus(comp.id, "Reopened")}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border px-2 py-1 rounded text-[10px] font-bold"
                              >
                                Reopen Ticket
                              </button>
                            )}
                            {comp.status === "Reopened" && (
                              <button
                                onClick={() => updateComplaintStatus(comp.id, "In Progress")}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border px-2 py-1 rounded text-[10px] font-bold"
                              >
                                Start Work
                              </button>
                            )}
                            {comp.status === "Open" && (
                              <span className="text-[10px] text-slate-400 font-semibold italic">Awaiting Assignment</span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-450 italic">—</span>
                        )}
                      </div>
                      
                      {comp.status === "Resolved/Closed" && comp.resolvedAt && (
                        <div className="text-[9px] text-slate-400 mt-1">Closed by {comp.resolvedBy}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredComplaints.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 italic">No complaint tickets logged.</div>
          ) : (
            filteredComplaints.map(comp => (
              <div key={comp.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-rose-600 text-sm">{comp.id}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${getStatusColor(comp.status)}`}>
                    {comp.status}
                  </span>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{comp.companyName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Order: {comp.orderId} · {comp.city}</p>
                  <p className="text-xs text-slate-600 bg-slate-50 border p-2.5 rounded-lg mt-2 italic">"{comp.issue}"</p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    {comp.assignedEngineer ? (
                      <span className="text-slate-600">Assigned: <strong>{comp.assignedEngineer}</strong></span>
                    ) : canWrite ? (
                      <button
                        onClick={() => setActiveComplaintForAssign(comp)}
                        className="bg-blue-50 text-blue-700 border px-2.5 py-1 rounded text-[11px] font-bold"
                      >
                        Assign Engineer
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    {canWrite && (
                      <>
                        {comp.status === "Assigned" && (
                          <button onClick={() => updateComplaintStatus(comp.id, "In Progress")} className="bg-amber-50 text-amber-700 border px-2 py-1 rounded text-[10px] font-bold">Start</button>
                        )}
                        {comp.status === "In Progress" && (
                          <button onClick={() => updateComplaintStatus(comp.id, "Resolved/Closed")} className="bg-emerald-50 text-emerald-700 border px-2 py-1 rounded text-[10px] font-bold">Resolve</button>
                        )}
                        {comp.status === "Resolved/Closed" && (
                          <button onClick={() => updateComplaintStatus(comp.id, "Reopened")} className="bg-purple-50 text-purple-700 border px-2 py-1 rounded text-[10px] font-bold">Reopen</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* LOG STANDALONE COMPLAINT DIALOG */}
      {isLogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 font-bold">Log Client Complaint</h3>
              <button onClick={() => setIsLogOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>

            <form onSubmit={handleLogComplaintSubmit}>
              <div className="p-5 space-y-4">
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5 relative">
                  Select Customer <span className="text-rose-500">*</span>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                    <input 
                      value={logCustomerSearch}
                      onChange={e => {
                        setLogCustomerSearch(e.target.value);
                        setLogCustomerId("");
                        setLogOrderId("");
                      }}
                      placeholder="Search Customer..."
                      className="w-full rounded-lg border bg-white px-3 py-2 pl-8 text-sm outline-none focus:border-[#5b8d65]"
                      required={!logCustomerId}
                    />
                  </div>
                  {logCustomerSearch && !logCustomerId && (
                    <div className="max-h-32 overflow-y-auto border rounded-lg bg-white mt-1 shadow-sm absolute top-[55px] left-0 right-0 z-10 w-full">
                      {customers.filter(c => c.name.toLowerCase().includes(logCustomerSearch.toLowerCase())).map(c => (
                        <div 
                          key={c.id} 
                          className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                          onClick={() => {
                            setLogCustomerId(c.id);
                            setLogCustomerSearch(c.name);
                            const custOrders = orders.filter(o => o.customerId === c.id);
                            if (custOrders.length === 1) {
                              setLogOrderId(custOrders[0].id);
                            } else {
                              setLogOrderId("");
                            }
                          }}
                        >
                          {c.name} ({c.city})
                        </div>
                      ))}
                    </div>
                  )}
                </label>

                {logCustomerId && (
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Select Order ID <span className="text-rose-500">*</span>
                    <select
                      value={logOrderId}
                      onChange={e => setLogOrderId(e.target.value)}
                      className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                      required
                    >
                      <option value="">-- Choose Order --</option>
                      {orders.filter(o => o.customerId === logCustomerId).map(o => (
                        <option key={o.id} value={o.id}>{o.id} - {o.branch || "Main"}</option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Fault Description <span className="text-rose-500">*</span>
                  <textarea
                    value={logIssue}
                    onChange={e => setLogIssue(e.target.value)}
                    placeholder="Describe machinery issues in detail..."
                    className="w-full min-h-[90px] rounded-lg border p-2.5 text-sm outline-none focus:border-[#5b8d65]"
                    required
                  />
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Attach Image (Optional)
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 text-xs" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Attach Voice Note (Optional)
                    <input type="file" accept="audio/*" onChange={handleAudioUpload} className="w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 text-xs" />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                <Button type="button" onClick={() => setIsLogOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                  Cancel
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg px-4">
                  Log Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN ENGINEER DIALOG WITH NEARBY SUGGESTIONS */}
      {activeComplaintForAssign && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">Assign Service Engineer</h3>
                <p className="text-xs text-slate-500">Ticket: {activeComplaintForAssign.id} · City: {activeComplaintForAssign.city}</p>
              </div>
              <button onClick={() => setActiveComplaintForAssign(null)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Nearby Engineers suggestions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#173c2d] uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={13} />
                  <span>Suggested Engineers (Same Base City: {activeComplaintForAssign.city})</span>
                </h4>
                {engineerGroup.nearby.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border">No active service engineers based in {activeComplaintForAssign.city}.</p>
                ) : (
                  <div className="space-y-1.5">
                    {engineerGroup.nearby.map(eng => (
                      <div key={eng.name} className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg text-xs">
                        <div>
                          <strong className="text-slate-800">{eng.name}</strong>
                          <span className="text-slate-500 ml-2">({eng.city})</span>
                        </div>
                        <button
                          onClick={() => handleAssignSubmit(eng.name)}
                          className="bg-[#173c2d] text-white px-2.5 py-1 rounded text-[10px] font-bold hover:bg-[#204a3b]"
                        >
                          Pick
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All other engineers */}
              <div className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Other Engineers (Other Cities)</h4>
                {engineerGroup.others.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No other engineers found.</p>
                ) : (
                  <div className="space-y-1.5">
                    {engineerGroup.others.map(eng => (
                      <div key={eng.name} className="flex justify-between items-center bg-slate-50 border p-2.5 rounded-lg text-xs">
                        <div>
                          <strong className="text-slate-800">{eng.name}</strong>
                          <span className="text-slate-500 ml-2">({eng.city})</span>
                        </div>
                        <button
                          onClick={() => handleAssignSubmit(eng.name)}
                          className="bg-slate-700 text-white px-2.5 py-1 rounded text-[10px] font-bold hover:bg-slate-800"
                        >
                          Pick
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
              <Button onClick={() => setActiveComplaintForAssign(null)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
