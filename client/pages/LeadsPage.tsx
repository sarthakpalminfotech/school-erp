import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, Filter, MessageSquare, MapPin, Phone, User, Calendar, Check, X, ClipboardList, Info, AlertTriangle, Upload, FileText, Bell } from "lucide-react";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { useAppState, Lead } from "@/hooks/useAppState";
import { NotesComponent } from "@/components/NotesComponent";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export const LeadsPage: React.FC = () => {
  const { leads, addLead, updateLead, updateLeadStatus, addNoteToLead, uploadQuotation, toggleQuotationApproval, deleteQuotation, employees, cities, customers, currentUserRole, currentSimulatedUser, products, hasWritePermission } = useAppState();
  const navigate = useNavigate();
  const canWrite = hasWritePermission("Leads");

  // Quotation Upload form state
  const [uploadType, setUploadType] = useState<"Technical" | "Bank" | "Service">("Technical");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [salesFilters, setSalesFilters] = useState<string[]>([]);
  const [cityFilters, setCityFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  // Follow Up Alert State
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUpLeadId, setFollowUpLeadId] = useState<string | null>(null);
  const [followUpDateInput, setFollowUpDateInput] = useState("");
  const [followUpTimeInput, setFollowUpTimeInput] = useState("");
  const [followUpNoteInput, setFollowUpNoteInput] = useState("");

  const handleOpenFollowUp = (leadId: string) => {
    setFollowUpLeadId(leadId);
    setFollowUpDateInput("");
    setFollowUpTimeInput("");
    setFollowUpNoteInput("");
    setIsFollowUpOpen(true);
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpLeadId || !followUpDateInput || !followUpTimeInput) return;
    
    const dateTime = `${followUpDateInput}T${followUpTimeInput}:00`;
    
    // update lead with new follow up date. Note: we are passing current status and reason so they don't change
    const targetLead = leads.find(l => l.id === followUpLeadId);
    if (targetLead) {
      await updateLeadStatus(followUpLeadId, targetLead.status, targetLead.statusReason, dateTime);
      
      if (followUpNoteInput.trim()) {
        await addNoteToLead(followUpLeadId, `[Follow Up Alert] ${followUpNoteInput}`);
      }
    }
    
    setIsFollowUpOpen(false);
    setFollowUpLeadId(null);
  };

  // Create/Edit Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [formCompany, setFormCompany] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSalesperson, setFormSalesperson] = useState("");

  useEffect(() => {
    if (!formSalesperson && employees.length > 0) {
      if (currentUserRole === "Sales Person") {
        setFormSalesperson(currentSimulatedUser);
      } else {
        const salesPersons = employees.filter(e => e.role === "Sales Person" || e.role === "Owner");
        if (salesPersons.length > 0) {
          setFormSalesperson(salesPersons[0].name);
        }
      }
    }
  }, [employees, currentUserRole, currentSimulatedUser, formSalesperson]);
  const [formCity, setFormCity] = useState("Ahmedabad");
  const [formAddress, setFormAddress] = useState("");
  const [formGstNumber, setFormGstNumber] = useState("");
  const [formStatus, setFormStatus] = useState<Lead["status"]>("In Process");
  const [formProducts, setFormProducts] = useState<{ productId: string; quantity: number; invoiceAmount: number }[]>([
    { productId: "", quantity: 1, invoiceAmount: 0 }
  ]);
  const [formError, setFormError] = useState("");
  const [formBranch, setFormBranch] = useState("");
  const [isAddingNewBranch, setIsAddingNewBranch] = useState(false);
  const [formCreatedAt, setFormCreatedAt] = useState("");

  const matchedCustomer = useMemo(() => {
    if (!formCompany.trim()) return null;
    return customers.find(c => c.name.toLowerCase() === formCompany.toLowerCase()) || null;
  }, [formCompany, customers]);

  // Status Change Popup state
  const [activeLeadForStatus, setActiveLeadForStatus] = useState<Lead | null>(null);
  const [targetStatus, setTargetStatus] = useState<Lead["status"] | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  // Lead Detail / Notes Drawer state
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<Lead | null>(null);

  // Success alert state
  const [alertMsg, setAlertMsg] = useState("");

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchQuery = `${l.company} ${l.contact || ""} ${l.city}`.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilters.length === 0 || statusFilters.includes(l.status);
      const matchSales = salesFilters.length === 0 || salesFilters.includes(l.salesperson);
      const matchCity = cityFilters.length === 0 || cityFilters.includes(l.city);
      
      let matchDate = true;
      if (dateRange.start || dateRange.end) {
        const leadDate = new Date(l.createdAt);
        if (dateRange.start && leadDate < new Date(dateRange.start)) matchDate = false;
        if (dateRange.end) {
          const endObj = new Date(dateRange.end);
          endObj.setHours(23, 59, 59, 999);
          if (leadDate > endObj) matchDate = false;
        }
      }

      return matchQuery && matchStatus && matchSales && matchCity && matchDate;
    });
  }, [leads, query, statusFilters, salesFilters, cityFilters, dateRange]);

  // Handle lead creation
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim()) {
      setFormError("Company name is required.");
      return;
    }
    if (!formPhone.trim()) {
      setFormError("Contact number is required.");
      return;
    }

    // Validations based on status
    if ((formStatus === "Lost" || formStatus === "Disqualified") && !statusReason.trim()) {
      setFormError("A reason is mandatory for Lost or Disqualified leads.");
      return;
    }
    if (formStatus === "Postponed" && !followUpDate) {
      setFormError("A follow-up date and time is required for Postponed leads.");
      return;
    }

    // Validate products
    const validProducts = formProducts.filter(p => p.productId !== "");
    const skipProductValidation = !["In Process", "Win"].includes(formStatus);
    
    if (!skipProductValidation && validProducts.length === 0) {
      setFormError("At least one product is required for this status.");
      return;
    }

    // Map products
    const dbProductsSelected = validProducts.map(p => {
      const prodObj = products.find(pr => pr.id === p.productId);
      return {
        productId: p.productId,
        productName: prodObj ? prodObj.name : "Unknown Product",
        quantity: p.quantity,
        invoiceAmount: p.invoiceAmount
      };
    });

    const parsedCreatedAt = formCreatedAt ? new Date(formCreatedAt).toISOString() : undefined;

    if (isEditMode && editingLeadId) {
      updateLead(editingLeadId, {
        company: formCompany,
        contact: formContact || undefined,
        phone: formPhone,
        salesperson: formSalesperson,
        city: formCity,
        branch: formBranch,
        address: formAddress,
        gstNumber: formGstNumber || undefined,
        productsSelected: dbProductsSelected,
        createdAt: currentUserRole === "Owner" ? parsedCreatedAt : undefined
      });
      // NOTE: Status is purposefully excluded here because it has its own dedicated logic
    } else {
      addLead({
        company: formCompany,
        contact: formContact || undefined,
        phone: formPhone,
        salesperson: formSalesperson,
        city: formCity,
        branch: formBranch,
        address: formAddress,
        gstNumber: formGstNumber || undefined,
        status: formStatus,
        productsSelected: dbProductsSelected,
        reason: statusReason || undefined,
        followUpDate: followUpDate || undefined,
        createdAt: currentUserRole === "Owner" ? parsedCreatedAt : undefined
      });
    }

    setFormCompany("");
    setFormContact("");
    setFormPhone("");
    setFormBranch("");
    setIsAddingNewBranch(false);
    setFormCreatedAt("");
    setFormAddress("");
    setFormGstNumber("");
    setFormStatus("In Process");
    setStatusReason("");
    setFollowUpDate("");
    setFormProducts([{ productId: "", quantity: 1, invoiceAmount: 0 }]);
    setFormSalesperson(currentUserRole === "Sales Person" ? currentSimulatedUser : (employees.filter(emp => emp.role === "Sales Person" || emp.role === "Owner")[0]?.name || ""));
    setFormError("");
    setIsCreateOpen(false);
    setIsEditMode(false);
    setEditingLeadId(null);
    setAlertMsg(isEditMode ? "Lead successfully updated." : "New lead successfully created.");
    setTimeout(() => setAlertMsg(""), 4000);
  };

  const handleOpenCreateLead = () => {
    setIsEditMode(false);
    setEditingLeadId(null);
    setFormCompany("");
    setFormContact("");
    setFormPhone("");
    setFormBranch("");
    setIsAddingNewBranch(false);
    setFormCreatedAt("");
    setFormAddress("");
    setFormGstNumber("");
    setFormStatus("In Process");
    setStatusReason("");
    setFollowUpDate("");
    setFormProducts([{ productId: "", quantity: 1, invoiceAmount: 0 }]);
    setFormSalesperson(currentUserRole === "Sales Person" ? currentSimulatedUser : (employees.filter(emp => emp.role === "Sales Person" || emp.role === "Owner")[0]?.name || ""));
    setIsCreateOpen(true);
  };

  const handleOpenEditLead = (lead: Lead) => {
    setIsEditMode(true);
    setEditingLeadId(lead.id);
    setFormCompany(lead.company);
    setFormContact(lead.contact || "");
    setFormPhone(lead.phone);
    setFormSalesperson(lead.salesperson);
    setFormCity(lead.city);
    setFormBranch(lead.branch);
    setFormAddress(lead.address);
    setFormGstNumber(lead.gstNumber || "");
    setFormStatus(lead.status);
    setFormCreatedAt(lead.createdAt ? new Date(lead.createdAt).toISOString().slice(0, 16) : "");
    setStatusReason(lead.statusReason || "");
    setFollowUpDate(lead.followUpDate || "");
    if (lead.productsSelected && lead.productsSelected.length > 0) {
      setFormProducts(lead.productsSelected.map(p => ({
        productId: p.productId,
        quantity: p.quantity,
        invoiceAmount: p.invoiceAmount
      })));
    } else {
      setFormProducts([{ productId: "", quantity: 1, invoiceAmount: 0 }]);
    }
    setIsCreateOpen(true);
  };

  // handleUploadSubmit is removed in favor of direct onChange handler

  // Open status popup
  const handleOpenStatusPopup = (lead: Lead, status: Lead["status"]) => {
    setActiveLeadForStatus(lead);
    setTargetStatus(status);
    setStatusReason("");
    setFollowUpDate("");
  };

  // Confirm status change
  const handleConfirmStatusChange = () => {
    if (!activeLeadForStatus || !targetStatus) return;

    // Validations
    if ((targetStatus === "Lost" || targetStatus === "Disqualified") && !statusReason.trim()) {
      alert("A reason is mandatory for Lost or Disqualified leads.");
      return;
    }
    if (targetStatus === "Postponed" && !followUpDate) {
      alert("A follow-up date and time is required.");
      return;
    }

    if ((targetStatus === "Win" || targetStatus === "In Process") && (!activeLeadForStatus.productsSelected || activeLeadForStatus.productsSelected.length === 0)) {
      alert("Please add at least one product to this lead before moving to In Process or Win status.");
      const leadToEdit = activeLeadForStatus;
      setActiveLeadForStatus(null);
      setTargetStatus(null);
      handleOpenEditLead(leadToEdit);
      return;
    }

    updateLeadStatus(activeLeadForStatus.id, targetStatus, statusReason || undefined, followUpDate || undefined);

    // If Postponed, add a note automatically
    if (targetStatus === "Postponed") {
      addNoteToLead(activeLeadForStatus.id, `Status set to Postponed. Scheduled follow-up: ${new Date(followUpDate).toLocaleString()}. Note: ${statusReason || 'No notes'}`);
    } else if (targetStatus === "Unavailable") {
      addNoteToLead(activeLeadForStatus.id, `Status set to Unavailable. Reason: ${statusReason || 'Not specified'}`);
    } else if (targetStatus === "Lost" || targetStatus === "Disqualified") {
      addNoteToLead(activeLeadForStatus.id, `Lead marked as ${targetStatus}. Reason: ${statusReason}`);
    }

    setActiveLeadForStatus(null);
    setTargetStatus(null);
    setStatusReason("");
    setFollowUpDate("");

    if (targetStatus === "Win") {
      setAlertMsg("Lead won! A new Customer and Order have been created. Redirecting to orders...");
      setTimeout(() => {
        setAlertMsg("");
        navigate("/orders");
      }, 2000);
    }
  };

  const getStatusColor = (status: Lead["status"]) => {
    switch (status) {
      case "In Process": return "bg-sky-100 text-sky-800 border-sky-200";
      case "Unavailable": return "bg-slate-100 text-slate-700 border-slate-200";
      case "Postponed": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Lost": return "bg-rose-100 text-rose-800 border-rose-200";
      case "Disqualified": return "bg-red-100 text-red-800 border-red-200";
      case "Win": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Converted": return "bg-teal-100 text-teal-800 border-teal-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-[#58705c] uppercase tracking-wider">Sales Pipeline</p>
        <div className="flex items-center gap-4">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#15251f]">Leads</h1>
          {canWrite && (
            <Button onClick={handleOpenCreateLead} className="bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center gap-1.5 rounded-xl py-1 px-3.5 text-xs h-[32px] shadow-sm">
              <Plus size={14} />
              <span>Add New Lead</span>
            </Button>
          )}
        </div>
        <p className="text-sm text-slate-500">Track every compressor sale opportunity from prospect to conversion.</p>
      </div>
      
      {/* Search & Filter bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search leads..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#5b8d65] focus:ring-1 focus:ring-[#5b8d65]/30 transition"
          />
        </div>
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="rounded-xl border border-slate-200 bg-white p-2.5 flex items-center justify-center hover:bg-slate-50 transition shadow-sm text-slate-600 h-[44px] w-[44px]"
          title="Open Filters"
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Success Notification Alert */}
      {alertMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800 shadow-sm animate-fadeIn">
          <Check size={18} className="text-emerald-600 shrink-0" />
          <div className="font-medium">{alertMsg}</div>
        </div>
      )}

      {/* Active Filter Tags */}
      {(statusFilters.length > 0 || salesFilters.length > 0 || cityFilters.length > 0 || dateRange.start || dateRange.end) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-slate-500 mr-1">Active Filters:</span>
          {statusFilters.map(s => (
            <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200">
              Status: {s}
              <button onClick={() => setStatusFilters(statusFilters.filter(f => f !== s))} className="hover:text-blue-900"><X size={12} /></button>
            </span>
          ))}
          {salesFilters.map(s => (
            <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs border border-purple-200">
              Rep: {s}
              <button onClick={() => setSalesFilters(salesFilters.filter(f => f !== s))} className="hover:text-purple-900"><X size={12} /></button>
            </span>
          ))}
          {cityFilters.map(c => (
            <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs border border-amber-200">
              City: {c}
              <button onClick={() => setCityFilters(cityFilters.filter(f => f !== c))} className="hover:text-amber-900"><X size={12} /></button>
            </span>
          ))}
          {(dateRange.start || dateRange.end) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
              Date: {dateRange.start || '...'} to {dateRange.end || '...'}
              <button onClick={() => setDateRange({ start: "", end: "" })} className="hover:text-emerald-900"><X size={12} /></button>
            </span>
          )}
        </div>
      )}

      {/* Leads Table (Desktop) / Cards (Mobile) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Table View (hidden on mobile, visible on lg and above) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Company Details</th>
                <th className="px-5 py-3.5">Salesperson</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No leads found matching current criteria.</td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLeadDetails(lead)}
                    className="hover:bg-slate-50/50 cursor-pointer transition"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{lead.company}</div>
                      <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                        {lead.contact && <span>{lead.contact}</span>}
                        {lead.contact && <span>·</span>}
                        <span className="flex items-center gap-0.5"><Phone size={11} /> {lead.phone}</span>
                      </div>
                      {/* Products Summary */}
                      {lead.productsSelected && lead.productsSelected.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {lead.productsSelected.map((prod, pIdx) => (
                            <span key={pIdx} className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-650 font-semibold border border-slate-200">
                              {prod.productName} (x{prod.quantity})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        <span>{lead.salesperson}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span>{lead.city}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1" onClick={e => e.stopPropagation()}>
                        {lead.status === "Converted" || !canWrite ? (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        ) : (
                          <select
                            value={lead.status}
                            onChange={(e) => {
                              handleOpenStatusPopup(lead, e.target.value as Lead["status"]);
                            }}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border outline-none cursor-pointer appearance-none pr-6 bg-no-repeat bg-right ${getStatusColor(lead.status)}`}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='currentColor' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`, backgroundPosition: 'calc(100% - 7px) center' }}
                          >
                            <option value="In Process">In Process</option>
                            <option value="Unavailable">Unavailable</option>
                            <option value="Postponed">Postponed</option>
                            <option value="Win">Win</option>
                            <option value="Lost">Lost</option>
                            <option value="Disqualified">Disqualified</option>
                          </select>
                        )}
                        
                        {canWrite && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFollowUp(lead.id);
                            }}
                            className="ml-2 rounded-full p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 transition shadow-sm border border-amber-200 inline-flex items-center"
                            title="Set Follow-up Alert"
                          >
                            <Bell size={13} />
                          </button>
                        )}
                        
                        {lead.followUpDate && (
                          <div className="text-[10px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                            <Calendar size={10} />
                            <span>Follow-up: {new Date(lead.followUpDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (Properly Separated) */}
        <div className="block lg:hidden space-y-3 bg-slate-50/50 p-3 rounded-2xl">
          {filteredLeads.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200">No leads found matching current criteria.</div>
          ) : (
            filteredLeads.map(lead => (
              <div
                key={lead.id}
                onClick={() => setSelectedLeadDetails(lead)}
                className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm space-y-3 hover:bg-slate-50/30 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">{lead.company}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{lead.contact || "No Contact Person"}</p>
                    {/* Products Summary */}
                    {lead.productsSelected && lead.productsSelected.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {lead.productsSelected.map((prod, pIdx) => (
                          <span key={pIdx} className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500 font-semibold border border-slate-200">
                            {prod.productName} (x{prod.quantity})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    {lead.status === "Converted" || !canWrite ? (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    ) : (
                      <select
                        value={lead.status}
                        onChange={(e) => {
                          handleOpenStatusPopup(lead, e.target.value as Lead["status"]);
                        }}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border outline-none cursor-pointer appearance-none pr-6 bg-no-repeat bg-right ${getStatusColor(lead.status)}`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='currentColor' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`, backgroundPosition: 'calc(100% - 7px) center' }}
                      >
                        <option value="In Process">In Process</option>
                        <option value="Unavailable">Unavailable</option>
                        <option value="Postponed">Postponed</option>
                        <option value="Win">Win</option>
                        <option value="Lost">Lost</option>
                        <option value="Disqualified">Disqualified</option>
                      </select>
                    )}
                    {canWrite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFollowUp(lead.id);
                        }}
                        className="ml-1 rounded-full p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 transition shadow-sm border border-amber-200 inline-flex items-center"
                        title="Set Follow-up Alert"
                      >
                        <Bell size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-slate-400" />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{lead.city}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <User size={12} className="text-slate-400" />
                    <span>Salesperson: <strong>{lead.salesperson}</strong></span>
                  </div>
                </div>

                {lead.followUpDate && (
                  <div className="text-[10px] text-amber-700 bg-amber-50/50 border border-amber-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 font-medium">
                    <Calendar size={12} />
                    <span>Next Follow-up: {new Date(lead.followUpDate).toLocaleString()}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE / EDIT LEAD DIALOG */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-display text-xl font-bold">{isEditMode ? "Edit Lead Details" : "Create a New Lead"}</h2>
                <p className="mt-1 text-sm text-slate-500">{isEditMode ? "Update the information for this prospect." : "Log client details for sales tracking."}</p>
              </div>
              <button onClick={() => { setIsCreateOpen(false); setIsEditMode(false); setEditingLeadId(null); }} className="rounded-lg p-2 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateLead}>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                {formError && (
                  <div className="col-span-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                    {formError}
                  </div>
                )}
                <label className="text-sm font-medium text-slate-700 col-span-2 sm:col-span-1">
                  Company Name <span className="text-rose-500">*</span>
                  <input
                    value={formCompany}
                    onChange={e => setFormCompany(e.target.value)}
                    placeholder="e.g. Navkar Packaging"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 col-span-2 sm:col-span-1">
                  Contact Number <span className="text-rose-500">*</span>
                  <input
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="e.g. +91 99887 76655"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 col-span-2 sm:col-span-1">
                  Contact Person
                  <input
                    value={formContact}
                    onChange={e => setFormContact(e.target.value)}
                    placeholder="e.g. Priyesh Jain"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                  />
                </label>

                {matchedCustomer ? (
                  <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border p-3.5 rounded-xl bg-slate-50/50">
                    <label className="text-sm font-medium text-slate-700">
                      Select Branch <span className="text-rose-500">*</span>
                      <select
                        value={isAddingNewBranch ? "__new__" : formBranch}
                        onChange={e => {
                          if (e.target.value === "__new__") {
                            setIsAddingNewBranch(true);
                            setFormBranch("");
                          } else {
                            setIsAddingNewBranch(false);
                            setFormBranch(e.target.value);
                          }
                        }}
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                        required
                      >
                        <option value="">-- Choose Branch --</option>
                        {(matchedCustomer.branches || []).map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                        <option value="__new__">+ Add New Branch</option>
                      </select>
                    </label>
                    {(isAddingNewBranch || !(matchedCustomer.branches && matchedCustomer.branches.length > 0)) && (
                      <label className="text-sm font-medium text-slate-700">
                        New Branch Name <span className="text-rose-500">*</span>
                        <input
                          value={formBranch}
                          onChange={e => setFormBranch(e.target.value)}
                          placeholder="e.g. GIDC Vatva"
                          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                          required
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="text-sm font-medium text-slate-700 col-span-2 sm:col-span-1">
                    Branch Name <span className="text-rose-500">*</span>
                    <input
                      value={formBranch}
                      onChange={e => setFormBranch(e.target.value)}
                      placeholder="e.g. Head Office"
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                      required
                    />
                  </label>
                )}
                
                <label className="text-sm font-medium text-slate-700 col-span-2 sm:col-span-1">
                  Salesperson <span className="text-rose-500">*</span>
                  <select
                    value={formSalesperson}
                    onChange={e => setFormSalesperson(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                  >
                    {employees.filter(emp => emp.role === "Sales Person" || emp.role === "Owner").map(emp => (
                      <option key={emp.name} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </label>
                
                <label className="text-sm font-medium text-slate-700 col-span-2 sm:col-span-1">
                  City <span className="text-rose-500">*</span>
                  <select
                    value={formCity}
                    onChange={e => setFormCity(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                  >
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                {currentUserRole === "Owner" && (
                  <label className="text-sm font-medium text-slate-700 col-span-2 sm:col-span-1">
                    Created At
                    <input
                      type="datetime-local"
                      value={formCreatedAt}
                      onChange={e => setFormCreatedAt(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                    />
                  </label>
                )}

                <label className="text-sm font-medium text-slate-700 col-span-2 sm:col-span-1">
                  Status <span className="text-rose-500">*</span>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as Lead["status"])}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                  >
                    <option value="In Process">In Process</option>
                    <option value="Unavailable">Unavailable</option>
                    <option value="Postponed">Postponed</option>
                    <option value="Win">Win</option>
                    <option value="Lost">Lost</option>
                    <option value="Disqualified">Disqualified</option>
                  </select>
                </label>

                {formStatus === "Unavailable" && (
                  <div className="col-span-2 sm:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Reason / Notes (Optional)</label>
                    <input
                      value={statusReason}
                      onChange={e => setStatusReason(e.target.value)}
                      placeholder="e.g. Client not responding on phone"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                    />
                  </div>
                )}

                {formStatus === "Postponed" && (
                  <div className="col-span-2 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Follow-up Date & Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={followUpDate}
                        onChange={e => setFollowUpDate(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Reason / Notes (Optional)</label>
                      <input
                        value={statusReason}
                        onChange={e => setStatusReason(e.target.value)}
                        placeholder="e.g. Waiting for layout"
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                      />
                    </div>
                  </div>
                )}

                {(formStatus === "Lost" || formStatus === "Disqualified") && (
                  <div className="col-span-2 sm:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Specify Reason <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={statusReason}
                      onChange={e => setStatusReason(e.target.value)}
                      placeholder={formStatus === "Lost" ? "e.g. Lost to competitor" : "e.g. Client has no power sanction"}
                      className="mt-1 w-full min-h-[60px] rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#5b8d65]"
                    />
                  </div>
                )}

                <label className="sm:col-span-2 text-sm font-medium text-slate-700">
                  Address
                  <textarea
                    value={formAddress}
                    onChange={e => setFormAddress(e.target.value)}
                    className="mt-1.5 min-h-[70px] w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#5b8d65]"
                    placeholder="Full corporate site address"
                  />
                </label>

                <label className="sm:col-span-2 text-sm font-medium text-slate-700">
                  GST Number (Optional)
                  <input
                    value={formGstNumber}
                    onChange={e => setFormGstNumber(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#5b8d65] uppercase"
                    placeholder="e.g. 27ABCDE1234F1Z5"
                  />
                </label>

                {/* Product Selection Sub-form */}
                <div className="col-span-2 border-t pt-4 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-800">Select Products {["In Process", "Win"].includes(formStatus) && <span className="text-rose-500">*</span>}</h3>
                    <Button
                      type="button"
                      onClick={() => setFormProducts([...formProducts, { productId: "", quantity: 1, invoiceAmount: 0 }])}
                      variant="outline"
                      size="sm"
                      className="text-xs flex items-center gap-1 py-1 px-2.5 border-slate-300 rounded-lg"
                    >
                      <Plus size={12} /> Add Product
                    </Button>
                  </div>

                  {formProducts.map((p, idx) => {
                    const isProductRequired = ["In Process", "Win"].includes(formStatus);
                    return (
                      <div key={idx} className="flex gap-2 items-end mb-2">
                        <label className="flex-1 text-xs font-semibold text-slate-650">
                          Product
                          <select
                            value={p.productId}
                            onChange={(e) => {
                              const prodId = e.target.value;
                              const selectedObj = products.find((pr) => pr.id === prodId);
                              const newArr = [...formProducts];
                              newArr[idx].productId = prodId;
                              newArr[idx].invoiceAmount = selectedObj?.price || 0;
                              setFormProducts(newArr);
                            }}
                            required={isProductRequired}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-[#5b8d65]"
                          >
                            <option value="" disabled>Select Product...</option>
                            {products.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name} {prod.model ? `(${prod.model})` : ""} - ₹{prod.price || 0}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="w-16 text-xs font-semibold text-slate-650">
                          Qty
                          <input
                            type="number"
                            min="1"
                            value={p.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              const newArr = [...formProducts];
                              newArr[idx].quantity = val;
                              setFormProducts(newArr);
                            }}
                            required={isProductRequired}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-[#5b8d65]"
                          />
                        </label>

                        <label className="w-24 text-xs font-semibold text-slate-650">
                          Invoice (₹)
                          <input
                            type="number"
                            min="0"
                            value={p.invoiceAmount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const newArr = [...formProducts];
                              newArr[idx].invoiceAmount = val;
                              setFormProducts(newArr);
                            }}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-[#5b8d65]"
                          />
                        </label>

                        {formProducts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormProducts(formProducts.filter((_, i) => i !== idx));
                            }}
                            className="mb-1 rounded-lg p-2 text-rose-500 hover:bg-rose-50 transition"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <div className="mt-3 text-right bg-slate-50 p-2.5 rounded-lg border text-xs font-bold text-slate-700">
                    Total Lead Value: <span className="text-emerald-700 text-sm font-extrabold">₹{formProducts.reduce((sum, p) => sum + (p.quantity * p.invoiceAmount), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t p-5 bg-slate-50/50 rounded-b-2xl">
                <Button type="button" onClick={() => { setIsCreateOpen(false); setIsEditMode(false); setEditingLeadId(null); }} variant="ghost" className="text-slate-600 rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl bg-[#173c2d] hover:bg-[#204a3b] text-white px-6">
                  {isEditMode ? "Save Changes" : "Create Lead"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS CHANGE DIALOG */}
      {activeLeadForStatus && targetStatus && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Confirm Status: <span className="text-[#173c2d]">{targetStatus}</span>
              </h3>
              <button onClick={() => { setActiveLeadForStatus(null); setTargetStatus(null); }} className="rounded-lg p-1.5 hover:bg-slate-100 transition">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to transition <strong>{activeLeadForStatus.company}</strong>'s status to <strong>{targetStatus}</strong>?
              </p>

              {/* Conditional popup fields */}
              {targetStatus === "Unavailable" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Reason / Notes (Optional)</label>
                  <input
                    value={statusReason}
                    onChange={e => setStatusReason(e.target.value)}
                    placeholder="e.g. Client not responding on phone"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                  />
                </div>
              )}

              {targetStatus === "Postponed" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Follow-up Date & Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={followUpDate}
                      onChange={e => setFollowUpDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Reason / Notes (Optional)</label>
                    <input
                      value={statusReason}
                      onChange={e => setStatusReason(e.target.value)}
                      placeholder="e.g. Waiting for client's site layout completion"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    />
                  </div>
                </div>
              )}

              {(targetStatus === "Lost" || targetStatus === "Disqualified") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Specify Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={statusReason}
                    onChange={e => setStatusReason(e.target.value)}
                    placeholder={targetStatus === "Lost" ? "e.g. Lost to competitor (Atlas Copco offering 5% lower rate)" : "e.g. Client has no power sanction at site yet"}
                    className="w-full min-h-[80px] rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#5b8d65]"
                  />
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-100 font-medium">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>A clear reason is required to submit.</span>
                  </div>
                </div>
              )}

              {targetStatus === "Win" && (
                <div className="text-xs text-slate-500 bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-start gap-2">
                  <Info size={14} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    This action will mark the lead as converted, automatically create a <strong>Customer Master</strong> record, open a new <strong>Order</strong> with status "In Process", and redirect you to configure the order.
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
              <Button
                onClick={() => { setActiveLeadForStatus(null); setTargetStatus(null); }}
                variant="ghost"
                className="text-slate-600 text-xs py-1.5 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmStatusChange}
                className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs py-1.5 px-4 rounded-lg"
              >
                Confirm State Transition
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LEAD DETAILS & NOTES DRAWER */}
      {selectedLeadDetails && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm">
          <div className="h-full w-full max-w-full md:max-w-5xl bg-white shadow-2xl flex flex-col animate-slideLeft">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">{selectedLeadDetails.company}</h3>
                <p className="text-xs text-slate-500">Lead File · ID: {selectedLeadDetails.id}</p>
              </div>
              <div className="flex items-center gap-3">
                {canWrite && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold text-[#173c2d] border-[#173c2d]/20 hover:bg-[#173c2d]/5"
                    onClick={() => {
                      setSelectedLeadDetails(null);
                      handleOpenEditLead(selectedLeadDetails);
                    }}
                  >
                    Edit Details
                  </Button>
                )}
                <button onClick={() => setSelectedLeadDetails(null)} className="rounded-lg p-1.5 hover:bg-slate-100 transition text-slate-500">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Lead Information */}
              <div className="space-y-3.5 bg-slate-50/50 border border-slate-100 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Prospect File</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Contact Person</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedLeadDetails.contact || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Contact Phone</span>
                    <p className="font-semibold text-[#173c2d] mt-0.5">{selectedLeadDetails.phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Lead Owner</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedLeadDetails.salesperson}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Base City</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedLeadDetails.city}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Branch</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedLeadDetails.branch || "Main"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Delivery Address</span>
                    <p className="font-semibold text-slate-800 mt-0.5 whitespace-pre-wrap">{selectedLeadDetails.address || "No address logged."}</p>
                  </div>
                </div>

                {/* Selected Products list inside details */}
                {selectedLeadDetails.productsSelected && selectedLeadDetails.productsSelected.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                    <span className="text-slate-500 text-xs block">Selected Products</span>
                    <div className="space-y-1">
                      {selectedLeadDetails.productsSelected.map((p, idx) => (
                        <div key={idx} className="flex justify-between text-xs bg-white border border-slate-150 rounded-lg p-2 font-medium">
                          <span>{p.productName} <strong className="text-slate-400">x{p.quantity}</strong></span>
                          <span className="font-bold text-slate-800">₹{(p.quantity * p.invoiceAmount).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-bold text-slate-700 bg-slate-100/60 rounded-lg p-2 mt-1 border">
                        <span>Total Lead Value</span>
                        <span className="text-emerald-700">₹{selectedLeadDetails.productsSelected.reduce((sum, p) => sum + (p.quantity * p.invoiceAmount), 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Status</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getStatusColor(selectedLeadDetails.status)}`}>
                        {selectedLeadDetails.status}
                      </span>
                    </div>
                  </div>
                  {selectedLeadDetails.followUpDate && (
                    <div className="text-right">
                      <span className="text-slate-500">Next Follow-up</span>
                      <p className="font-semibold text-amber-700 mt-0.5">{new Date(selectedLeadDetails.followUpDate).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {selectedLeadDetails.statusReason && (
                  <div className="mt-2.5 bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-xs">
                    <span className="font-bold text-rose-800">Status Note:</span>
                    <p className="text-rose-700 mt-0.5">{selectedLeadDetails.statusReason}</p>
                  </div>
                )}
              </div>

              {/* Document Upload Section */}
              <div className="space-y-3 bg-slate-50/50 border border-slate-100 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quotations & Documents</h4>
                
                {canWrite && (
                  <div className="flex flex-col sm:flex-row gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm items-end">
                    <div className="flex gap-2 flex-1 w-full">
                      <select
                        value={uploadType}
                        onChange={e => setUploadType(e.target.value as "Technical" | "Bank" | "Service")}
                        className="w-full rounded-lg border bg-white px-2 py-1.5 text-xs outline-none focus:border-[#5b8d65]"
                      >
                        <option value="Technical">Technical</option>
                        <option value="Bank">Bank</option>
                        <option value="Service">Service</option>
                      </select>
                    </div>
                    <div className="flex-1 w-full">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && selectedLeadDetails) {
                            await uploadQuotation(selectedLeadDetails.id, uploadType, file, true);
                            // Refresh the drawer details state
                            const updated = leads.find(l => l.id === selectedLeadDetails.id);
                            if (updated) setSelectedLeadDetails(updated);
                          }
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      />
                      <Button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="w-full bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center justify-center gap-1.5 rounded-lg py-1 text-xs h-[30px]"
                      >
                        <Upload size={12} />
                        <span>Upload Document</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Document List */}
                <div className="mt-3">
                  {!selectedLeadDetails.quotations || selectedLeadDetails.quotations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-2">No documents uploaded yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                      {selectedLeadDetails.quotations.map(quo => (
                        <div key={quo.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="grid h-7 w-7 place-items-center rounded bg-emerald-50 text-emerald-800 shrink-0">
                              <FileText size={14} />
                            </div>
                            <div className="min-w-0">
                              <p 
                                className="text-xs font-semibold text-slate-800 leading-tight truncate cursor-pointer hover:text-[#173c2d] hover:underline transition-colors" 
                                title={quo.fileName}
                                onClick={() => setPreviewFileName(quo.fileName)}
                              >
                                {quo.fileName}
                              </p>
                              <p className="text-[9px] text-slate-400 mt-0.5 truncate">{quo.type} · {quo.fileSize}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Approval Status Badge */}
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                              quo.approved
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}>
                              {quo.approved ? "Approved" : "Pending Approval"}
                            </span>

                            {canWrite && (
                              <button
                                onClick={async () => {
                                  await deleteQuotation(selectedLeadDetails.id, quo.id);
                                  const updated = leads.find(l => l.id === selectedLeadDetails.id);
                                  if (updated) setSelectedLeadDetails(updated);
                                }}
                                className="text-[10px] text-rose-600 hover:underline font-bold px-1"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reusable Notes Component Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Activity & Notes Log</h4>
                <NotesComponent
                  notes={selectedLeadDetails.notes}
                  readOnly={!canWrite}
                  onAddNote={(text, photo, voice) => {
                    addNoteToLead(selectedLeadDetails.id, text, photo, voice);
                    // Refresh drawer details state
                    const updated = leads.find(l => l.id === selectedLeadDetails.id);
                    if (updated) setSelectedLeadDetails(updated);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* FILTER MODAL */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-scaleUp overflow-y-auto max-h-[90vh]">
            <div className="border-b p-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">Filters</h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Status Filters */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Filter by Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {["In Process", "Unavailable", "Postponed", "Win", "Lost", "Disqualified", "Converted"].map(status => (
                    <label key={status} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statusFilters.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) setStatusFilters([...statusFilters, status]);
                          else setStatusFilters(statusFilters.filter(s => s !== status));
                        }}
                        className="rounded border-slate-350 text-[#173c2d] focus:ring-[#5b8d65]"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>

              {/* Salesperson Filters */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Filter by Salesperson</h4>
                <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {employees.filter(e => e.role === "Sales Person" || e.role === "Owner").map(emp => (
                    <label key={emp.name} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={salesFilters.includes(emp.name)}
                        onChange={(e) => {
                          if (e.target.checked) setSalesFilters([...salesFilters, emp.name]);
                          else setSalesFilters(salesFilters.filter(s => s !== emp.name));
                        }}
                        className="rounded border-slate-350 text-[#173c2d] focus:ring-[#5b8d65]"
                      />
                      {emp.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* City Filters */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Filter by City</h4>
                <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {cities.map(city => (
                    <label key={city} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cityFilters.includes(city)}
                        onChange={(e) => {
                          if (e.target.checked) setCityFilters([...cityFilters, city]);
                          else setCityFilters(cityFilters.filter(c => c !== city));
                        }}
                        className="rounded border-slate-350 text-[#173c2d] focus:ring-[#5b8d65]"
                      />
                      {city}
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Filters */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Filter by Date Range</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-medium text-slate-500 block mb-1">From</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#5b8d65]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-medium text-slate-500 block mb-1">To</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#5b8d65]"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t p-4 bg-slate-50">
              <Button 
                type="button" 
                onClick={() => {
                  setStatusFilters([]);
                  setSalesFilters([]);
                  setCityFilters([]);
                  setDateRange({ start: "", end: "" });
                }} 
                variant="ghost" 
                className="text-xs text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                Clear All
              </Button>
              <Button type="button" onClick={() => setIsFilterModalOpen(false)} className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FOLLOW UP ALERT MODAL */}
      {isFollowUpOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell size={18} className="text-amber-600" />
                Set Follow-up Alert
              </h3>
              <button onClick={() => setIsFollowUpOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveFollowUp}>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Date <span className="text-rose-500">*</span>
                    <input
                      type="date"
                      required
                      value={followUpDateInput}
                      onChange={e => setFollowUpDateInput(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Time <span className="text-rose-500">*</span>
                    <input
                      type="time"
                      required
                      value={followUpTimeInput}
                      onChange={e => setFollowUpTimeInput(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    />
                  </label>
                </div>
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Notes / Description
                  <textarea
                    rows={3}
                    value={followUpNoteInput}
                    onChange={e => setFollowUpNoteInput(e.target.value)}
                    placeholder="Enter discussion points or reason for follow up..."
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65] resize-none"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                <Button type="button" onClick={() => setIsFollowUpOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg px-4">
                  Set Alert
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal 
        isOpen={!!previewFileName} 
        fileName={previewFileName} 
        onClose={() => setPreviewFileName(null)} 
      />
    </section>
  );
};
