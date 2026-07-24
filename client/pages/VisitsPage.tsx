import React, { useState, useMemo, useEffect } from "react";
import { Search, Plus, Filter, MapPin, Phone, User, Calendar, Check, X, CalendarClock, ChevronDown, Edit2, Play, CheckSquare, PhoneCall } from "lucide-react";
import { useAppState, Visit } from "@/hooks/useAppState";
import { NotesComponent } from "@/components/NotesComponent";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export const VisitsPage: React.FC = () => {
  const {
    visits,
    addVisit,
    startVisit,
    logVisit,
    updateVisitStatus,
    updateVisit,
    addNoteToVisit,
    customers,
    employees,
    cities,
    products,
    currentUserRole,
    currentSimulatedUser,
    hasWritePermission
  } = useAppState();

  const canWrite = hasWritePermission("Visits");

  // Search & Filter State
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [salesFilter, setSalesFilter] = useState<string>("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Active Selected Visit for Full-Screen Details View
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  // Edit/Create Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  // Form Fields
  const [formCompany, setFormCompany] = useState("");
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [formContact, setFormContact] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCity, setFormCity] = useState("Ahmedabad");
  const [formAddress, setFormAddress] = useState("");
  const [formBranch, setFormBranch] = useState("");
  const [formSalesperson, setFormSalesperson] = useState("");
  const [formScheduledDate, setFormScheduledDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; quantity: number }[]>([]);

  // Log Visit Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logVisitId, setLogVisitId] = useState<string | null>(null);
  const [logStatus, setLogStatus] = useState<Visit["status"] | "">("");
  const [logNotes, setLogNotes] = useState("");
  const [logPhoto, setLogPhoto] = useState<string | null>(null);
  const [logVoice, setLogVoice] = useState<string | null>(null);
  const [logFollowUpDate, setLogFollowUpDate] = useState("");
  const [logReason, setLogReason] = useState("");
  
  // Audio recording/photo mock simulation inside Log Outcome popup
  const [isRecording, setIsRecording] = useState(false);

  // Details Tabs
  const [detailsTab, setDetailsTab] = useState<"notes" | "activity">("notes");
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Filtered Visits List
  const filteredVisits = useMemo(() => {
    return (visits || []).filter(v => {
      const matchesQuery = `${v.companyName} ${v.contactPerson || ""} ${v.city || ""}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = !statusFilter || v.status === statusFilter;
      const matchesSales = !salesFilter || v.salesperson === salesFilter;
      return matchesQuery && matchesStatus && matchesSales;
    });
  }, [visits, query, statusFilter, salesFilter]);

  // Set default salesperson for form based on role
  useEffect(() => {
    if (currentUserRole !== "Owner") {
      setFormSalesperson(currentSimulatedUser);
    } else if (employees.length > 0 && !formSalesperson) {
      setFormSalesperson(employees[0].name);
    }
  }, [currentUserRole, currentSimulatedUser, employees, formSalesperson]);

  // Auto-filtering suggestions for customer selection
  const companySuggestions = useMemo(() => {
    if (!formCompany.trim()) return [];
    return customers.filter(c => c.name.toLowerCase().includes(formCompany.toLowerCase()));
  }, [formCompany, customers]);

  const handleSelectCustomer = (customer: typeof customers[0]) => {
    setFormCompany(customer.name);
    setFormContact(customer.contactPerson || "");
    setFormPhone(customer.phone || "");
    setFormCity(customer.city || "Ahmedabad");
    setFormAddress(customer.address || "");
    setFormBranch(customer.branches?.[0] || "");
    setShowCompanySuggestions(false);
  };

  const handleProductQuantityChange = (productId: string, delta: number) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === productId);
      if (existing) {
        const nextQty = existing.quantity + delta;
        if (nextQty <= 0) {
          return prev.filter(p => p.productId !== productId);
        }
        return prev.map(p => p.productId === productId ? { ...p, quantity: nextQty } : p);
      } else if (delta > 0) {
        return [...prev, { productId, quantity: delta }];
      }
      return prev;
    });
  };

  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim()) return alert("Company name is required.");

    const dbProducts = selectedProducts.map(sp => {
      const prod = products.find(p => p.id === sp.productId);
      return {
        productId: sp.productId,
        productName: prod ? prod.name : "Unknown Product",
        quantity: sp.quantity,
        invoiceAmount: prod?.price || 0
      };
    });

    const visitPayload = {
      companyName: formCompany,
      contactPerson: formContact || undefined,
      phone: formPhone || undefined,
      city: formCity || undefined,
      address: formAddress || undefined,
      branch: formBranch || undefined,
      productsSelected: dbProducts,
      salesperson: formSalesperson || currentSimulatedUser,
      scheduledAt: formScheduledDate ? new Date(formScheduledDate).toISOString() : undefined,
      notesText: formNotes || undefined
    };

    if (editingVisit) {
      await updateVisit(editingVisit.id, visitPayload);
    } else {
      await addVisit(visitPayload);
    }

    setIsFormModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingVisit(null);
    setFormCompany("");
    setFormContact("");
    setFormPhone("");
    setFormCity("Ahmedabad");
    setFormAddress("");
    setFormBranch("");
    setFormScheduledDate("");
    setFormNotes("");
    setSelectedProducts([]);
    if (currentUserRole !== "Owner") {
      setFormSalesperson(currentSimulatedUser);
    } else {
      setFormSalesperson("");
    }
  };

  const handleOpenEdit = (v: Visit) => {
    setEditingVisit(v);
    setFormCompany(v.companyName);
    setFormContact(v.contactPerson || "");
    setFormPhone(v.phone || "");
    setFormCity(v.city || "Ahmedabad");
    setFormAddress(v.address || "");
    setFormBranch(v.branch || "");
    setFormSalesperson(v.salesperson || "");
    setFormScheduledDate(v.scheduledAt ? new Date(v.scheduledAt).toISOString().slice(0, 16) : "");
    setSelectedProducts((v.productsSelected || []).map(p => ({ productId: p.productId, quantity: p.quantity })));
    setFormNotes("");
    setIsFormModalOpen(true);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setLogVoice("Voice Note (0:12s)");
    }, 3000);
  };

  const handleAttachPhoto = () => {
    setLogPhoto("https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80");
  };

  const handleSaveLogOutcome = async () => {
    if (!logStatus) return alert("Outcome status is mandatory.");
    if (["Unavailable", "Postponed"].includes(logStatus) && !logNotes.trim()) {
      return alert("Notes are required for this status.");
    }
    if (logStatus === "Postponed" && !logFollowUpDate) {
      return alert("Follow-up date is mandatory for Postponed status.");
    }
    if (["Disqualified", "Lost"].includes(logStatus) && !logNotes.trim()) {
      return alert("Notes/Reason are mandatory for this status.");
    }

    if (logVisitId) {
      await logVisit(logVisitId, {
        status: logStatus,
        notesText: logNotes,
        photo: logPhoto || undefined,
        voiceNote: logVoice || undefined,
        followUpDate: logFollowUpDate ? new Date(logFollowUpDate).toISOString() : undefined,
        reason: logNotes
      });
    }

    setIsLogModalOpen(false);
    setLogVisitId(null);
    setLogStatus("");
    setLogNotes("");
    setLogPhoto(null);
    setLogVoice(null);
    setLogFollowUpDate("");
    setLogReason("");
  };

  const handleCall = (phone: string) => {
    navigator.clipboard.writeText(phone);
    window.location.href = `tel:${phone}`;
  };

  const getStatusBadgeStyles = (status: Visit["status"]) => {
    switch (status) {
      case "Pending": return "bg-gray-100 text-gray-700 border-gray-200";
      case "Started": return "bg-blue-100 text-blue-700 border-blue-200 animate-pulse";
      case "In communication": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "Unavailable": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Postponed": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Disqualified": return "bg-red-100 text-red-700 border-red-200";
      case "Convert to lead": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Lost": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const selectedVisit = useMemo(() => {
    return visits.find(v => v.id === selectedVisitId) || null;
  }, [visits, selectedVisitId]);

  // Construct Dynamic Activity Logs for details screen
  const visitActivities = useMemo(() => {
    if (!selectedVisit) return [];
    const logs = [];
    logs.push({
      action: "Visit created/scheduled",
      timestamp: new Date(selectedVisit.createdAt).toLocaleString(),
      user: selectedVisit.salesperson || "System"
    });
    if (selectedVisit.startTime) {
      logs.push({
        action: `Visit started${selectedVisit.startLocation ? ` at location: Lat ${selectedVisit.startLocation.lat.toFixed(4)}, Lng ${selectedVisit.startLocation.lng.toFixed(4)}` : ""}`,
        timestamp: new Date(selectedVisit.startTime).toLocaleString(),
        user: selectedVisit.salesperson || "System"
      });
    }
    if (selectedVisit.status !== "Pending" && selectedVisit.status !== "Started") {
      logs.push({
        action: `Outcome logged: ${selectedVisit.status}${selectedVisit.reason ? ` - ${selectedVisit.reason}` : ""}`,
        timestamp: new Date(selectedVisit.updatedAt).toLocaleString(),
        user: selectedVisit.salesperson || "System"
      });
    }
    return logs;
  }, [selectedVisit]);

  // Render Full Screen Details Screen if visit is selected
  return (
    <>
      {selectedVisit ? (
        <div className="min-h-screen bg-slate-50 text-slate-800 px-4 py-5 space-y-5 animate-fadeIn">
        {/* Top bar details layout */}
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedVisitId(null)} className="text-[#173c2d] font-semibold text-sm flex items-center gap-1">
            ← Back to list
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEdit(selectedVisit)}
              className="p-2 border bg-white rounded-lg hover:bg-slate-100 shadow-sm text-slate-650"
            >
              <Edit2 size={16} />
            </button>
            <div className="shrink-0">
              {selectedVisit.status === "Pending" ? (
                <button
                  onClick={() => startVisit(selectedVisit.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                >
                  <Play size={12} fill="white" />
                  <span>Start Visit</span>
                </button>
              ) : selectedVisit.status === "Started" ? (
                <button
                  onClick={() => {
                    setLogVisitId(selectedVisit.id);
                    setIsLogModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                >
                  <CheckSquare size={12} />
                  <span>Log Visit</span>
                </button>
              ) : (
                <select
                  value={selectedVisit.status}
                  onChange={(e) => {
                    const nextStat = e.target.value as Visit["status"];
                    if (["Unavailable", "Postponed", "Disqualified", "Lost"].includes(nextStat)) {
                      setLogVisitId(selectedVisit.id);
                      setLogStatus(nextStat);
                      setIsLogModalOpen(true);
                    } else if (nextStat === "Convert to lead") {
                      if (window.confirm("Are you sure you want to convert this visit to a lead? It will be moved to the Leads module.")) {
                        updateVisitStatus(selectedVisit.id, nextStat);
                        setSelectedVisitId(null);
                      }
                    } else {
                      updateVisitStatus(selectedVisit.id, nextStat);
                    }
                  }}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold cursor-pointer outline-none bg-[#fff] ${getStatusBadgeStyles(selectedVisit.status)}`}
                >
                  <option value="In communication">In communication</option>
                  <option value="Unavailable">Unavailable</option>
                  <option value="Postponed">Postponed</option>
                  <option value="Disqualified">Disqualified</option>
                  <option value="Convert to lead">Convert to lead</option>
                  <option value="Lost">Lost</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Core details direct on screen (no boxes) */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{selectedVisit.companyName}</h1>
          </div>

          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-slate-600 text-sm">
            <span className="font-semibold">{selectedVisit.contactPerson || "No contact person"}</span>
            {selectedVisit.phone && (
              <span className="flex items-center gap-1">
                <span>·</span>
                <span className="font-mono text-slate-900">{selectedVisit.phone}</span>
                <button
                  onClick={() => handleCall(selectedVisit.phone!)}
                  className="p-1 text-emerald-650 hover:bg-emerald-50 rounded"
                  title="Call number"
                >
                  <PhoneCall size={14} />
                </button>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 border-t border-slate-200/80 pt-3 text-xs text-slate-650">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">City</p>
              <p className="mt-0.5 text-slate-800">{selectedVisit.city || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Branch</p>
              <p className="mt-0.5 text-slate-800">{selectedVisit.branch || "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Address</p>
              <p className="mt-0.5 text-slate-800 leading-relaxed">{selectedVisit.address || "-"}</p>
            </div>
            {currentUserRole === "Owner" && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Salesperson</p>
                <p className="mt-0.5 text-slate-800 font-medium">{selectedVisit.salesperson || "-"}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scheduled Visit</p>
              <p className="mt-0.5 text-slate-800 font-medium">
                {selectedVisit.scheduledAt ? new Date(selectedVisit.scheduledAt).toLocaleString() : "-"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Started At Date/Time</p>
              <p className="mt-0.5 text-slate-800 font-medium">
                {selectedVisit.startTime ? new Date(selectedVisit.startTime).toLocaleString() : "-"}
              </p>
            </div>
          </div>

          {/* Interested products list */}
          <div className="border-t border-slate-200/80 pt-3 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interested Products</h3>
            {selectedVisit.productsSelected && selectedVisit.productsSelected.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedVisit.productsSelected.map((p, idx) => (
                  <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg px-2.5 py-1">
                    {p.productName} (x{p.quantity})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No products selected.</p>
            )}
          </div>
        </div>

        {/* Bottom tabbed layout for Owner, Direct Notes for others */}
        <div className="border-t border-slate-200/80 pt-4 space-y-3">
          {currentUserRole === "Owner" ? (
            <div className="space-y-4">
              <div className="flex border-b">
                <button
                  onClick={() => setDetailsTab("notes")}
                  className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 text-center transition ${detailsTab === "notes" ? "border-[#173c2d] text-[#173c2d]" : "border-transparent text-slate-400"}`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setDetailsTab("activity")}
                  className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 text-center transition ${detailsTab === "activity" ? "border-[#173c2d] text-[#173c2d]" : "border-transparent text-slate-400"}`}
                >
                  Activity Logs
                </button>
              </div>
              
              {detailsTab === "notes" ? (
                <NotesComponent
                  notes={selectedVisit.notes}
                  onAddNote={(text, photo, voice) => addNoteToVisit(selectedVisit.id, text, photo, voice)}
                />
              ) : (
                <div className="space-y-3.5 pl-2">
                  {(showAllActivities ? visitActivities : visitActivities.slice(0, 3)).map((act, i) => (
                    <div key={i} className="relative pl-5 border-l-2 border-slate-200 pb-2">
                      <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                      <div className="text-xs font-semibold text-slate-700">{act.action}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{act.timestamp} · {act.user}</div>
                    </div>
                  ))}
                  {visitActivities.length > 3 && (
                    <button
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="text-xs font-semibold text-[#173c2d] hover:underline mt-2 block"
                    >
                      {showAllActivities ? "Show less" : `View more (${visitActivities.length - 3} more)`}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Operational Notes</h2>
              <NotesComponent
                notes={selectedVisit.notes}
                onAddNote={(text, photo, voice) => addNoteToVisit(selectedVisit.id, text, photo, voice)}
              />
            </div>
          )}
        </div>
      </div>
      ) : (
        <section className="mx-auto max-w-[1500px] px-4 py-5 space-y-4">
      {/* Dynamic upcoming alerts */}
      {visits.some(v => {
        if (!v.scheduledAt || v.status !== 'Pending') return false;
        const diff = new Date(v.scheduledAt).getTime() - new Date().getTime();
        return diff > 0 && diff <= 60 * 60 * 1000;
      }) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 flex gap-2.5 text-xs font-medium animate-fadeIn">
          <CalendarClock size={16} className="text-amber-600 shrink-0" />
          <div>
            <strong>Upcoming scheduled visit alert!</strong> You have a visit scheduled in less than an hour.
          </div>
        </div>
      )}

      {/* Direct Search bar and filter icon */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search visits by company or city..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-[#173c2d] focus:ring-1 focus:ring-[#173c2d]/20 transition"
          />
        </div>
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="rounded-xl border border-slate-200 bg-white p-2 flex items-center justify-center hover:bg-slate-50 transition shadow-sm text-slate-650 h-[36px] w-[36px]"
          title="Filters"
        >
          <Filter size={16} />
        </button>
      </div>

      {/* Filters Applied tags summary */}
      {(statusFilter || salesFilter) && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold text-slate-500">Filters:</span>
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs border">
              Status: {statusFilter}
              <button onClick={() => setStatusFilter("")}><X size={10} /></button>
            </span>
          )}
          {salesFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs border">
              Rep: {salesFilter}
              <button onClick={() => setSalesFilter("")}><X size={10} /></button>
            </span>
          )}
        </div>
      )}

      {/* Visits direct list layout cards */}
      <div className="space-y-3.5">
        {filteredVisits.length === 0 ? (
          <div className="text-center py-12 text-slate-400 italic text-xs bg-white rounded-xl border">
            No visits logged matching current search filters.
          </div>
        ) : (
          filteredVisits.map(visit => (
            <div
              key={visit.id}
              onClick={() => setSelectedVisitId(visit.id)}
              className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50/20 transition-all cursor-pointer space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base leading-tight">{visit.companyName}</h3>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  {visit.status === "Pending" ? (
                    <button
                      onClick={() => startVisit(visit.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1"
                    >
                      <Play size={10} fill="white" />
                      <span>Start Visit</span>
                    </button>
                  ) : visit.status === "Started" ? (
                    <button
                      onClick={() => {
                        setLogVisitId(visit.id);
                        setIsLogModalOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1"
                    >
                      <CheckSquare size={10} />
                      <span>Log Visit</span>
                    </button>
                  ) : (
                    <select
                      value={visit.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        const nextStat = e.target.value as Visit["status"];
                        if (["Unavailable", "Postponed", "Disqualified", "Lost"].includes(nextStat)) {
                          setLogVisitId(visit.id);
                          setLogStatus(nextStat);
                          setIsLogModalOpen(true);
                        } else if (nextStat === "Convert to lead") {
                          if (window.confirm("Are you sure you want to convert this visit to a lead? It will be moved to the Leads module.")) {
                            updateVisitStatus(visit.id, nextStat);
                          }
                        } else {
                          updateVisitStatus(visit.id, nextStat);
                        }
                      }}
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold cursor-pointer outline-none appearance-none ${getStatusBadgeStyles(visit.status)}`}
                      style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                    >
                      <option value="In communication">In communication</option>
                      <option value="Unavailable">Unavailable</option>
                      <option value="Postponed">Postponed</option>
                      <option value="Disqualified">Disqualified</option>
                      <option value="Convert to lead">Convert to lead</option>
                      <option value="Lost">Lost</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Card Meta details */}
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs text-slate-500/90 font-medium">
                <div>Contact: <span className="text-slate-800">{visit.contactPerson || "-"}</span></div>
                <div>City: <span className="text-slate-800">{visit.city || "-"}</span></div>
                {visit.phone && <div className="col-span-2">Phone: <span className="text-slate-850 font-mono">{visit.phone}</span></div>}
                {currentUserRole === "Owner" && (
                  <div className="col-span-2">Salesperson: <span className="text-slate-700 font-semibold">{visit.salesperson || "-"}</span></div>
                )}
                {visit.scheduledAt && (
                  <div className="col-span-2 flex items-center gap-1.5 text-slate-500">
                    <CalendarClock size={12} />
                    <span>Scheduled: {new Date(visit.scheduledAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB Floating action button for creation */}
      {canWrite && (
        <button
          onClick={() => {
            resetForm();
            setIsFormModalOpen(true);
          }}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#173c2d] text-white flex items-center justify-center shadow-lg hover:bg-[#204a3b] transition-all transform hover:scale-105 z-30"
          title="Add new visit opportunity"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      )}
      </section>
      )}

      {/* FILTER MODAL POPUP */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl animate-scaleUp p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">Filter Visits</h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="text-slate-400 hover:text-slate-650"><X size={16} /></button>
            </div>
            
            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-650">
                Visit Status
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Started">Started</option>
                  <option value="In communication">In communication</option>
                  <option value="Unavailable">Unavailable</option>
                  <option value="Postponed">Postponed</option>
                  <option value="Disqualified">Disqualified</option>
                  <option value="Convert to lead">Convert to lead</option>
                  <option value="Lost">Lost</option>
                </select>
              </label>

              {currentUserRole === "Owner" && (
                <label className="block font-semibold text-slate-650">
                  Salesperson Representative
                  <select
                    value={salesFilter}
                    onChange={e => setSalesFilter(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                  >
                    <option value="">All Representatives</option>
                    {employees.filter(e => e.role === "Sales Person" || e.role === "Owner").map(emp => (
                      <option key={emp.name} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={() => {
                  setStatusFilter("");
                  setSalesFilter("");
                  setIsFilterModalOpen(false);
                }}
                variant="outline"
                className="flex-1 text-xs"
              >
                Reset Filters
              </Button>
              <Button onClick={() => setIsFilterModalOpen(false)} className="flex-1 bg-[#173c2d] hover:bg-[#204a3b] text-xs">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT VISIT DIALOG */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-xl bg-white shadow-xl animate-scaleUp p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-bold text-base text-slate-950">{editingVisit ? "Edit Scheduled Visit" : "Schedule New Visit"}</h2>
              <button onClick={() => { setIsFormModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-650"><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-3.5 text-xs">
              {/* Company Selection Combobox */}
              <div className="relative">
                <label className="block font-semibold text-slate-700">
                  Company Name <span className="text-rose-500">*</span>
                  <input
                    value={formCompany}
                    onChange={e => {
                      setFormCompany(e.target.value);
                      setShowCompanySuggestions(true);
                    }}
                    onFocus={() => setShowCompanySuggestions(true)}
                    placeholder="Search or enter company name"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                    required
                  />
                </label>
                {showCompanySuggestions && companySuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 z-50 max-h-32 overflow-y-auto">
                    {companySuggestions.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className="p-2 hover:bg-slate-50 cursor-pointer font-medium border-b border-slate-100 last:border-0"
                      >
                        {cust.name} ({cust.city})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">
                  Contact Person
                  <input
                    value={formContact}
                    onChange={e => setFormContact(e.target.value)}
                    placeholder="Person name"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                  />
                </label>
                <label className="block font-semibold text-slate-700">
                  Contact Phone Number
                  <input
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="Number"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">
                  City
                  <select
                    value={formCity}
                    onChange={e => setFormCity(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                  >
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="block font-semibold text-slate-700">
                  Branch Name
                  {/* Dropdown if existing customer branches exist, otherwise input text */}
                  {formCompany && customers.find(c => c.name.toLowerCase() === formCompany.toLowerCase())?.branches?.length ? (
                    <select
                      value={formBranch}
                      onChange={e => setFormBranch(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                    >
                      <option value="">Select branch</option>
                      {(customers.find(c => c.name.toLowerCase() === formCompany.toLowerCase())?.branches || []).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={formBranch}
                      onChange={e => setFormBranch(e.target.value)}
                      placeholder="e.g. GIDC Unit 2"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                    />
                  )}
                </label>
              </div>

              <label className="block font-semibold text-slate-700">
                Detailed Address
                <textarea
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  placeholder="Address coordinates or landmark details..."
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 h-12 resize-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                {currentUserRole === "Owner" ? (
                  <label className="block font-semibold text-slate-700">
                    Assigned Salesperson
                    <select
                      value={formSalesperson}
                      onChange={e => setFormSalesperson(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                    >
                      {employees.filter(e => e.role === "Sales Person" || e.role === "Owner").map(emp => (
                        <option key={emp.name} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div>
                    <span className="block font-semibold text-slate-400">Representative</span>
                    <p className="mt-2 text-slate-800 font-bold">{currentSimulatedUser}</p>
                  </div>
                )}

                <label className="block font-semibold text-slate-700">
                  Scheduled Date & Time
                  <input
                    type="datetime-local"
                    value={formScheduledDate}
                    onChange={e => setFormScheduledDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2"
                  />
                </label>
              </div>

              {/* Product Selection checkboxes with Steppers */}
              <div className="space-y-1.5 pb-4">
                <span className="block font-semibold text-slate-700">Interested Products Selection</span>
                <select 
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 appearance-none cursor-pointer"
                  onChange={(e) => {
                    const pid = e.target.value;
                    if (!pid) return;
                    if (!selectedProducts.find(sp => sp.productId === pid)) {
                      handleProductQuantityChange(pid, 1);
                    }
                    e.target.value = ""; 
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>+ Select a Product to Add...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.model || 'Default'})</option>)}
                </select>
                
                {selectedProducts.length > 0 && (
                  <div className="border border-slate-200 rounded-lg p-2 mt-2 space-y-2 bg-slate-50/50 max-h-32 overflow-y-auto">
                    {selectedProducts.map(sel => {
                      const prod = products.find(p => p.id === sel.productId);
                      if (!prod) return null;
                      return (
                        <div key={prod.id} className="flex items-center justify-between">
                          <span className="font-medium text-slate-700 leading-tight mr-2">{prod.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleProductQuantityChange(prod.id, -1)}
                              className="w-5 h-5 rounded bg-slate-200 text-slate-750 flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="font-semibold w-5 text-center">{sel.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleProductQuantityChange(prod.id, 1)}
                              className="w-5 h-5 rounded bg-slate-200 text-slate-750 flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {!editingVisit && (
                <label className="block font-semibold text-slate-700">
                  Initial Log/Visit Notes
                  <textarea
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="Any initial instructions, context or notes for scheduling..."
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 h-12 resize-none"
                  />
                </label>
              )}

              <div className="flex gap-2 pt-2.5 border-t">
                <Button
                  type="button"
                  onClick={() => {
                    setIsFormModalOpen(false);
                    resetForm();
                  }}
                  variant="outline"
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-[#173c2d] hover:bg-[#204a3b] text-xs">
                  Save Visit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG VISIT POPUP MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl animate-scaleUp p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">Log Visit Outcome</h3>
              <button
                onClick={() => {
                  setIsLogModalOpen(false);
                  setLogStatus("");
                }}
                className="text-slate-400 hover:text-slate-650"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <label className="block font-semibold text-slate-750">
                Select Outcome Status <span className="text-rose-500">*</span>
                <select
                  value={logStatus}
                  onChange={e => setLogStatus(e.target.value as Visit["status"])}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                  required
                >
                  <option value="">-- Choose Status --</option>
                  <option value="In communication">In communication</option>
                  <option value="Unavailable">Unavailable</option>
                  <option value="Postponed">Postponed</option>
                  <option value="Disqualified">Disqualified</option>
                  <option value="Convert to lead">Convert to lead</option>
                  <option value="Lost">Lost</option>
                </select>
              </label>

              {/* Conditional Follow Up Date for Postponed */}
              {logStatus === "Postponed" && (
                <label className="block font-semibold text-slate-750">
                  Follow-up Date & Time <span className="text-rose-500">*</span>
                  <input
                    type="datetime-local"
                    value={logFollowUpDate}
                    onChange={e => setLogFollowUpDate(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border p-2"
                    required
                  />
                </label>
              )}

              {/* Notes block with Camera/Voice support */}
              {logStatus !== "" && (
                <div className="space-y-2 border-t pt-2">
                  <label className="block font-semibold text-slate-750">
                    Notes / Reasons {["Unavailable", "Postponed", "Disqualified", "Lost"].includes(logStatus) && <span className="text-rose-500">*</span>}
                    <textarea
                      value={logNotes}
                      onChange={e => setLogNotes(e.target.value)}
                      placeholder="Describe what occurred during the visit..."
                      className="mt-1.5 w-full rounded-lg border p-2.5 h-16 resize-none"
                    />
                  </label>

                  {/* Attachment Previews */}
                  {(logPhoto || logVoice || isRecording) && (
                    <div className="flex flex-wrap gap-2.5 border-t border-slate-100 pt-2">
                      {logPhoto && (
                        <div className="relative group rounded-lg overflow-hidden border bg-white p-1">
                          <img src={logPhoto} alt="Outcome Photo" className="h-10 w-14 object-cover rounded" />
                          <button onClick={() => setLogPhoto(null)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                            <X size={8} />
                          </button>
                        </div>
                      )}

                      {logVoice && (
                        <div className="flex items-center gap-1.5 rounded-lg border bg-white px-2 py-1 text-[10px] text-slate-600">
                          <span>{logVoice}</span>
                          <button onClick={() => setLogVoice(null)} className="text-slate-400 hover:text-red-500">
                            <X size={10} />
                          </button>
                        </div>
                      )}

                      {isRecording && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-600 font-medium">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-650 animate-ping" />
                          <span>Simulating Mic...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Media buttons */}
                  <div className="flex gap-2 text-slate-500">
                    <button
                      type="button"
                      onClick={handleAttachPhoto}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1 transition"
                    >
                      📷 Photo
                    </button>
                    <button
                      type="button"
                      disabled={isRecording}
                      onClick={handleStartRecording}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1 transition disabled:opacity-50"
                    >
                      🎤 Voice
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={() => {
                  setIsLogModalOpen(false);
                  setLogStatus("");
                }}
                variant="outline"
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveLogOutcome} className="flex-1 bg-[#173c2d] hover:bg-[#204a3b] text-xs">
                Submit Outcome
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
