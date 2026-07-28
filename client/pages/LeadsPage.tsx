import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, Filter, MessageSquare, MapPin, Phone, User, Calendar, Check, X, ClipboardList, Info, AlertTriangle, Upload, FileText, Bell, Edit2, PhoneCall } from "lucide-react";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { useAppState, Lead } from "@/hooks/useAppState";
import { NotesComponent } from "@/components/NotesComponent";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export const LeadsPage: React.FC = () => {
  const { leads, orders, quotationRequests, addQuotationRequest, resolveQuotationRequest, addLead, updateLead, updateLeadStatus, addNoteToLead, uploadQuotation, toggleQuotationApproval, deleteQuotation, employees, cities, customers, currentUserRole, currentSimulatedUser, products, hasWritePermission } = useAppState();
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
  const [followUpPhoto, setFollowUpPhoto] = useState<string | null>(null);
  const [followUpVoice, setFollowUpVoice] = useState<string | null>(null);

  // Ask for Quote Modal State
  const [isAskQuoteOpen, setIsAskQuoteOpen] = useState(false);
  const [askQuoteTech, setAskQuoteTech] = useState(false);
  const [askQuoteBank, setAskQuoteBank] = useState(false);
  const [askQuoteNotes, setAskQuoteNotes] = useState("");
  const [askQuotePhoto, setAskQuotePhoto] = useState<string | null>(null);
  const [askQuoteVoice, setAskQuoteVoice] = useState<string | null>(null);

  // Tab State for Lead details notes/activity logs
  const [detailsTab, setDetailsTab] = useState<"notes" | "activity">("notes");
  const [showAllActivities, setShowAllActivities] = useState(false);

  const handleOpenFollowUp = (leadId: string) => {
    setFollowUpLeadId(leadId);
    setFollowUpDateInput("");
    setFollowUpTimeInput("");
    setFollowUpNoteInput("");
    setFollowUpPhoto(null);
    setFollowUpVoice(null);
    setIsFollowUpOpen(true);
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpLeadId || !followUpDateInput || !followUpTimeInput) return;
    
    const dateTime = `${followUpDateInput}T${followUpTimeInput}:00`;
    
    const targetLead = leads.find(l => l.id === followUpLeadId);
    if (targetLead) {
      await updateLeadStatus(followUpLeadId, targetLead.status, targetLead.statusReason, dateTime);
      
      if (followUpNoteInput.trim() || followUpPhoto || followUpVoice) {
        await addNoteToLead(followUpLeadId, `[Follow Up Alert] ${followUpNoteInput}`, followUpPhoto || undefined, followUpVoice || undefined);
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
  const [formStatus, setFormStatus] = useState<Lead["status"]>("New");
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

  // Keep selectedLeadDetails in sync with leads array
  useEffect(() => {
    if (selectedLeadDetails) {
      const updated = leads.find(l => l.id === selectedLeadDetails.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedLeadDetails)) {
        setSelectedLeadDetails(updated);
      } else if (!updated) {
        setSelectedLeadDetails(null);
      }
    }
  }, [leads, selectedLeadDetails]);

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
    if (!formContact.trim()) {
      setFormError("Contact person name is required.");
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

    // Validate products
    const validProducts = formProducts.filter(p => p.productId !== "");
    const skipProductValidation = !["In Quotation", "In Discussion", "Win"].includes(formStatus);
    
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
    setFormStatus("New");
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
    setFormStatus("New");
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

    if (["In Quotation", "In Discussion", "Win"].includes(targetStatus) && (!activeLeadForStatus.productsSelected || activeLeadForStatus.productsSelected.length === 0)) {
      alert(`Please add at least one product to this lead before moving to ${targetStatus} status.`);
      const leadToEdit = activeLeadForStatus;
      setActiveLeadForStatus(null);
      setTargetStatus(null);
      handleOpenEditLead(leadToEdit);
      return;
    }

    updateLeadStatus(activeLeadForStatus.id, targetStatus, statusReason || undefined, followUpDate || undefined);

    if (targetStatus === "Lost" || targetStatus === "Disqualified") {
      addNoteToLead(activeLeadForStatus.id, `Lead marked as ${targetStatus}. Reason: ${statusReason}`);
    } else {
      addNoteToLead(activeLeadForStatus.id, `Status set to ${targetStatus}.`);
    }

    setActiveLeadForStatus(null);
    setTargetStatus(null);
    setStatusReason("");
    setFollowUpDate("");

    if (targetStatus === "Win") {
      if (currentUserRole === "Sales Person") {
        setAlertMsg("Lead won! A new Customer and Order have been created. Returning to leads...");
        setTimeout(() => {
          setAlertMsg("");
          setSelectedLeadDetails(null);
          navigate("/");
        }, 2000);
      } else {
        setAlertMsg("Lead won! A new Customer and Order have been created. Redirecting to orders...");
        setTimeout(() => {
          setAlertMsg("");
          navigate("/orders");
        }, 2000);
      }
    }
  };

  const getStatusColor = (status: Lead["status"]) => {
    switch (status) {
      case "New": return "bg-blue-100 text-blue-800 border-blue-200";
      case "In Quotation": return "bg-indigo-100 text-indigo-850 border-indigo-200";
      case "In Discussion": return "bg-purple-100 text-purple-850 border-purple-200";
      case "Lost": return "bg-rose-100 text-rose-800 border-rose-200";
      case "Disqualified": return "bg-red-100 text-red-800 border-red-200";
      case "Win": return "bg-emerald-100 text-emerald-800 border-[#5b8d65]";
      case "Converted": return "bg-teal-100 text-teal-800 border-teal-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Construct Dynamic Activity Logs for Lead details screen
  const leadActivities = useMemo(() => {
    if (!selectedLeadDetails) return [];
    const logs: { action: string; timestamp: string; user: string; rawTime: number }[] = [];

    // 1. Created
    logs.push({
      action: selectedLeadDetails.convertedAt ? "Lead converted from Visit" : "Lead created directly",
      timestamp: new Date(selectedLeadDetails.createdAt).toLocaleString(),
      user: selectedLeadDetails.createdBy || selectedLeadDetails.salesperson || "System",
      rawTime: new Date(selectedLeadDetails.createdAt).getTime()
    });

    // 2. Status change notes (dynamic from notes that look like status updates)
    selectedLeadDetails.notes.forEach(note => {
      if (note.text.startsWith("Status set to") || note.text.startsWith("Lead marked as") || note.text.startsWith("[Follow Up Alert]")) {
        logs.push({
          action: note.text,
          timestamp: new Date(note.timestamp).toLocaleString(),
          user: note.user,
          rawTime: new Date(note.timestamp).getTime()
        });
      }
    });

    // 3. Quotations uploaded
    if (selectedLeadDetails.quotations) {
      selectedLeadDetails.quotations.forEach(q => {
        logs.push({
          action: `Quotation Document Uploaded (${q.type}) - ${q.fileName}`,
          timestamp: new Date(q.uploadedAt).toLocaleString(),
          user: q.uploadedBy,
          rawTime: new Date(q.uploadedAt).getTime()
        });
      });
    }

    // 4. Quotation requests
    quotationRequests.filter(qr => qr.leadId === selectedLeadDetails.id).forEach(qr => {
      logs.push({
        action: `Quotation requested (${qr.requestedTypes.join(", ")})`,
        timestamp: new Date(qr.requestedAt).toLocaleString(),
        user: qr.requestedBy,
        rawTime: new Date(qr.requestedAt).getTime()
      });
    });

    // Sort by rawTime descending (latest first)
    return logs.sort((a, b) => b.rawTime - a.rawTime);
  }, [selectedLeadDetails, quotationRequests]);

  const isOrderCommissioned = useMemo(() => {
    if (!selectedLeadDetails) return false;
    const relatedOrder = orders.find(o => o.leadId === selectedLeadDetails.id);
    return relatedOrder?.status === "Commissioning Pending" || relatedOrder?.status === "Commissioned/Completed";
  }, [orders, selectedLeadDetails]);

  const leadQuoteRequests = useMemo(() => {
    if (!selectedLeadDetails) return [];
    return quotationRequests.filter(qr => qr.leadId === selectedLeadDetails.id);
  }, [quotationRequests, selectedLeadDetails]);

  return (
    <>
      {selectedLeadDetails ? (
        <div className="min-h-screen bg-slate-50 text-slate-800 px-4 py-5 space-y-5 animate-fadeIn">
          {/* Scheduled Alert Banner */}
          {selectedLeadDetails.followUpDate && new Date(selectedLeadDetails.followUpDate) > new Date() && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center justify-between">
               <div className="flex flex-col">
                 <span className="text-amber-800 font-bold text-xs flex items-center gap-1"><Bell size={14}/> Scheduled Alert</span>
                 <span className="text-[10px] text-amber-700 font-semibold mt-0.5">{new Date(selectedLeadDetails.followUpDate).toLocaleString()}</span>
                 {selectedLeadDetails.notes.find(n => n.text.startsWith("[Follow Up Alert]")) && (
                    <span className="text-[11px] text-amber-800/80 mt-1 italic">Note: {selectedLeadDetails.notes.find(n => n.text.startsWith("[Follow Up Alert]"))?.text.replace("[Follow Up Alert]", "").trim()}</span>
                 )}
               </div>
               <button 
                 onClick={async () => {
                   await updateLeadStatus(selectedLeadDetails.id, selectedLeadDetails.status, selectedLeadDetails.statusReason, undefined);
                   const updated = leads.find(l => l.id === selectedLeadDetails.id);
                   if (updated) setSelectedLeadDetails({...updated, followUpDate: undefined});
                 }} 
                 className="text-xs bg-amber-200/50 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded font-semibold transition"
               >
                 Dismiss
               </button>
            </div>
          )}

          {/* Top Bar Details */}
          <div className="flex items-center justify-between">
            <button onClick={() => setSelectedLeadDetails(null)} className="text-[#173c2d] font-semibold text-sm flex items-center gap-1">
              ← Back to list
            </button>
            <div className="flex items-center gap-2">
              {canWrite && (
                <>
                  <button
                    onClick={() => handleOpenFollowUp(selectedLeadDetails.id)}
                    className="p-2 border bg-white rounded-lg hover:bg-slate-100 shadow-sm text-slate-650 flex items-center justify-center"
                    title="Set Follow-up Alert"
                  >
                    <Bell size={16} />
                  </button>
                  <button
                    onClick={() => handleOpenEditLead(selectedLeadDetails)}
                    className="p-2 border bg-white rounded-lg hover:bg-slate-100 shadow-sm text-slate-650 flex items-center justify-center"
                  >
                    <Edit2 size={16} />
                  </button>
                </>
              )}
              <div className="shrink-0">
                {selectedLeadDetails.status === "Converted" || !canWrite ? (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-semibold border ${getStatusColor(selectedLeadDetails.status)}`}>
                    {selectedLeadDetails.status}
                  </span>
                ) : (
                  <div className="flex flex-col items-end">
                    <select
                      value={selectedLeadDetails.status}
                      onChange={(e) => {
                        handleOpenStatusPopup(selectedLeadDetails, e.target.value as Lead["status"]);
                      }}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold cursor-pointer outline-none bg-white ${getStatusColor(selectedLeadDetails.status)}`}
                    >
                      <option value="New">New</option>
                      <option value="In Quotation">In Quotation</option>
                      <option value="In Discussion">In Discussion</option>
                      <option value="Win">Win</option>
                      <option value="Lost">Lost</option>
                      <option value="Disqualified">Disqualified</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedLeadDetails.status === "In Quotation" && canWrite && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-150 rounded-lg p-2.5 text-xs font-semibold">
              <span className="text-indigo-800">Select Quotation Substatus:</span>
              <select
                value={selectedLeadDetails.substatus || ""}
                onChange={async (e) => {
                  await updateLeadStatus(selectedLeadDetails.id, "In Quotation", selectedLeadDetails.statusReason, selectedLeadDetails.followUpDate, e.target.value);
                  const updated = leads.find(l => l.id === selectedLeadDetails.id);
                  if (updated) setSelectedLeadDetails(updated);
                }}
                className="rounded border border-indigo-200 bg-white px-2.5 py-1 text-xs outline-none text-indigo-900 cursor-pointer font-bold"
              >
                <option value="">Choose Substatus...</option>
                <option value="Bank Quotation">Bank Quotation</option>
                <option value="Technical Quotation">Technical Quotation</option>
              </select>
            </div>
          )}

          {/* Details Content */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{selectedLeadDetails.company}</h1>
            </div>

            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-slate-600 text-sm">
              <span className="font-semibold">{selectedLeadDetails.contact || "No contact person"}</span>
              {selectedLeadDetails.phone && (
                <span className="flex items-center gap-1">
                  <span>·</span>
                  <span className="font-mono text-slate-900">{selectedLeadDetails.phone}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedLeadDetails.phone);
                      window.location.href = `tel:${selectedLeadDetails.phone}`;
                    }}
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
                <p className="mt-0.5 text-slate-800">{selectedLeadDetails.city || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Branch</p>
                <p className="mt-0.5 text-slate-800">{selectedLeadDetails.branch || "Main"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Address</p>
                <p className="mt-0.5 text-slate-800 leading-relaxed">{selectedLeadDetails.address || "No address logged."}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Salesperson</p>
                <p className="mt-0.5 text-slate-800 font-medium">{selectedLeadDetails.salesperson || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {selectedLeadDetails.convertedAt ? "Date Lead Converted" : "Date Lead Created"}
                </p>
                <p className="mt-0.5 text-slate-850 font-medium">
                  {new Date(selectedLeadDetails.convertedAt || selectedLeadDetails.createdAt).toLocaleString()}
                </p>
              </div>
              {selectedLeadDetails.gstNumber && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GST Number</p>
                  <p className="mt-0.5 text-slate-850 font-mono font-medium uppercase">{selectedLeadDetails.gstNumber}</p>
                </div>
              )}
              {selectedLeadDetails.substatus && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quotation Substatus</p>
                  <p className="mt-0.5 text-indigo-700 font-semibold">{selectedLeadDetails.substatus}</p>
                </div>
              )}
              {selectedLeadDetails.followUpDate && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Next Follow-up</p>
                  <p className="mt-0.5 text-amber-700 font-medium">{new Date(selectedLeadDetails.followUpDate).toLocaleString()}</p>
                </div>
              )}
              {selectedLeadDetails.statusReason && (
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status Reason</p>
                  <p className="mt-0.5 text-rose-700 leading-relaxed">{selectedLeadDetails.statusReason}</p>
                </div>
              )}
            </div>

            {/* Selected Products list inside details */}
            {selectedLeadDetails.productsSelected && selectedLeadDetails.productsSelected.length > 0 && (
              <div className="border-t border-slate-200/80 pt-3 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Products</h3>
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
          </div>

          {/* Quotations & Documents Section */}
          <div className="border-t border-slate-200/80 pt-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              Quotations & Documents
              {currentUserRole === "Owner" && selectedLeadDetails.quotations?.some(q => !q.approved) && (
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Pending Quotation Approval" />
              )}
            </h4>
            {canWrite && (
              <div className="flex items-center gap-2 bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm">
                <select
                  value={uploadType}
                  onChange={e => setUploadType(e.target.value as "Technical" | "Bank" | "Service")}
                  className="rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold outline-none border-slate-200 cursor-pointer flex-1"
                >
                  <option value="Technical">Technical</option>
                  <option value="Bank">Bank</option>
                  {isOrderCommissioned && <option value="Service">Service</option>}
                </select>

                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && selectedLeadDetails) {
                      await uploadQuotation(selectedLeadDetails.id, uploadType, file, true);
                      const updated = leads.find(l => l.id === selectedLeadDetails.id);
                      if (updated) setSelectedLeadDetails(updated);
                    }
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 border rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center"
                  title="Upload Document"
                >
                  <Upload size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAskQuoteTech(false);
                    setAskQuoteBank(false);
                    setAskQuoteNotes("");
                    setAskQuotePhoto(null);
                    setAskQuoteVoice(null);
                    setIsAskQuoteOpen(true);
                  }}
                  className="p-2 border rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center"
                  title="Ask for Quote"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            )}

            {/* Display requested quotes logs for salesperson, owner, receptionist */}
            {["Sales Person", "Owner", "Receptionist"].includes(currentUserRole) && leadQuoteRequests.length > 0 && (
              <div className="space-y-1.5 mt-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quotation Requests</p>
                {leadQuoteRequests.map(qr => (
                  <div key={qr.id} className="text-xs bg-indigo-50/50 border border-indigo-100 rounded-lg p-2.5 space-y-1">
                    <div className="flex justify-between font-medium text-indigo-900">
                      <span>Quotation asked: <strong className="font-semibold text-slate-800">{qr.requestedTypes.join(", ")}</strong></span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(qr.requestedAt).toLocaleDateString()}</span>
                    </div>
                    {qr.notes && <p className="text-slate-650 italic">"{qr.notes}"</p>}
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-slate-400">By: {qr.requestedBy}</span>
                      {!qr.resolved ? (
                        (currentUserRole === "Owner" || currentUserRole === "Receptionist") && (
                          <button
                            onClick={async () => {
                              await resolveQuotationRequest(qr.id);
                            }}
                            className="text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase px-2 py-0.5 rounded shadow-sm"
                          >
                            Resolve Alert
                          </button>
                        )
                      ) : (
                        <span className="text-[9px] text-emerald-600 font-semibold uppercase">Resolved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate">{quo.type} · {new Date(quo.uploadedAt).toLocaleDateString('en-IN')} · {quo.uploadedBy.split(' (')[0]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border ${quo.approved ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                          {quo.approved ? "Approved" : "Pending Approval"}
                        </span>
                        {currentUserRole === "Owner" && (
                          <button
                            onClick={async () => {
                              await toggleQuotationApproval(selectedLeadDetails.id, quo.id);
                            }}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors ${quo.approved ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50" : "bg-[#173c2d] text-white border-[#173c2d] hover:bg-[#204a3b]"}`}
                          >
                            {quo.approved ? "Unapprove" : "Approve"}
                          </button>
                        )}
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

          {/* Activity Logs & Notes with tabs */}
          {currentUserRole === "Owner" ? (
            <div className="space-y-4 border-t border-slate-200/80 pt-4">
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
                  notes={selectedLeadDetails.notes}
                  readOnly={!canWrite}
                  onAddNote={(text, photo, voice) => {
                    addNoteToLead(selectedLeadDetails.id, text, photo, voice);
                    const updated = leads.find(l => l.id === selectedLeadDetails.id);
                    if (updated) setSelectedLeadDetails(updated);
                  }}
                />
              ) : (
                <div className="space-y-3.5 pl-2">
                  {(showAllActivities ? leadActivities : leadActivities.slice(0, 3)).map((act, i) => (
                    <div key={i} className="relative pl-5 border-l-2 border-slate-200 pb-2">
                      <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                      <div className="text-xs font-semibold text-slate-700">{act.action}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{act.timestamp} · {act.user}</div>
                    </div>
                  ))}
                  {leadActivities.length > 3 && (
                    <button
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="text-xs font-semibold text-[#173c2d] hover:underline mt-2 block"
                    >
                      {showAllActivities ? "Show less" : `View more (${leadActivities.length - 3} more)`}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="border-t border-slate-200/80 pt-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Operational Notes</h2>
              <NotesComponent
                notes={selectedLeadDetails.notes}
                readOnly={!canWrite}
                onAddNote={(text, photo, voice) => {
                  addNoteToLead(selectedLeadDetails.id, text, photo, voice);
                  const updated = leads.find(l => l.id === selectedLeadDetails.id);
                  if (updated) setSelectedLeadDetails(updated);
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <section className="mx-auto max-w-[1500px] px-4 py-5 space-y-4">
          {/* Search bar & Filter icon */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search leads by company, contact or city..."
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

          {/* Success Notification Alert */}
          {alertMsg && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-sm animate-fadeIn">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <div className="font-medium">{alertMsg}</div>
            </div>
          )}

          {/* Active Filter Tags */}
          {(statusFilters.length > 0 || salesFilters.length > 0 || cityFilters.length > 0 || dateRange.start || dateRange.end) && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold text-slate-500">Filters:</span>
              {statusFilters.map(s => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs border">
                  Status: {s}
                  <button onClick={() => setStatusFilters(statusFilters.filter(f => f !== s))}><X size={10} /></button>
                </span>
              ))}
              {salesFilters.map(s => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs border">
                  Rep: {s}
                  <button onClick={() => setSalesFilters(salesFilters.filter(f => f !== s))}><X size={10} /></button>
                </span>
              ))}
              {cityFilters.map(c => (
                <span key={c} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs border">
                  City: {c}
                  <button onClick={() => setCityFilters(cityFilters.filter(f => f !== c))}><X size={10} /></button>
                </span>
              ))}
              {(dateRange.start || dateRange.end) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs border">
                  Date Range
                  <button onClick={() => setDateRange({ start: "", end: "" })}><X size={10} /></button>
                </span>
              )}
            </div>
          )}

          {/* Cards List Layout */}
          <div className="space-y-3.5">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic text-xs bg-white rounded-xl border">
                No leads found matching current search filters.
              </div>
            ) : (
              filteredLeads.map(lead => {
                const hasUnresolved = quotationRequests.some(qr => qr.leadId === lead.id && !qr.resolved);
                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLeadDetails(lead)}
                    className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50/20 transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-base leading-tight flex items-center gap-1.5">
                          {lead.company}
                          {hasUnresolved && (currentUserRole === "Owner" || currentUserRole === "Receptionist") && (
                            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Unresolved Quotation Request" />
                          )}
                          {currentUserRole === "Owner" && lead.quotations?.some(q => !q.approved) && (
                            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Pending Quotation Approval" />
                          )}
                        </h3>
                      </div>
                      <div onClick={e => e.stopPropagation()}>
                        {lead.status === "Converted" || !canWrite ? (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        ) : (
                          <select
                            value={lead.status}
                            onClick={e => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleOpenStatusPopup(lead, e.target.value as Lead["status"]);
                            }}
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold cursor-pointer outline-none appearance-none ${getStatusColor(lead.status)}`}
                            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                          >
                            <option value="New">New</option>
                            <option value="In Quotation">In Quotation</option>
                            <option value="In Discussion">In Discussion</option>
                            <option value="Win">Win</option>
                            <option value="Lost">Lost</option>
                            <option value="Disqualified">Disqualified</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Card Meta details */}
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs text-slate-500/90 font-medium">
                      <div>Contact: <span className="text-slate-800">{lead.contact || "-"}</span></div>
                      <div>City: <span className="text-slate-800">{lead.city || "-"}</span></div>
                      {lead.phone && <div className="col-span-2">Phone: <span className="text-slate-850 font-mono">{lead.phone}</span></div>}
                      {currentUserRole === "Owner" && (
                        <div className="col-span-2">Salesperson: <span className="text-slate-700 font-semibold">{lead.salesperson || "-"}</span></div>
                      )}
                      {lead.followUpDate && (
                        <div className="col-span-2 flex items-center gap-1.5 text-amber-600 bg-amber-50/50 rounded-lg p-1.5">
                          <Calendar size={12} />
                          <span>Follow-up: {new Date(lead.followUpDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Products selected listing */}
                    {lead.productsSelected && lead.productsSelected.length > 0 && (
                      <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-1.5 mt-1">
                        {lead.productsSelected.map((p, idx) => (
                          <span key={idx} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-700">
                            {p.productName} ({p.quantity})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Floating Action Button */}
          {canWrite && (
            <button
              onClick={handleOpenCreateLead}
              className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#173c2d] text-white flex items-center justify-center shadow-lg hover:bg-[#204a3b] transition-all transform hover:scale-105 z-30"
              title="Add new lead"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )}
        </section>
      )}

      {/* CREATE / EDIT LEAD DIALOG */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white sm:bg-slate-900/40 sm:grid sm:place-items-center sm:p-4 sm:backdrop-blur-sm">
          <div className="h-full w-full sm:h-auto sm:max-h-[92vh] sm:max-w-xl overflow-y-auto sm:rounded-2xl bg-white shadow-2xl animate-scaleUp flex flex-col">
            <div className="flex items-center justify-between border-b p-5 sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-display text-xl font-bold">{isEditMode ? "Edit Lead Details" : "Create a New Lead"}</h2>
                <p className="mt-1 text-sm text-slate-500">{isEditMode ? "Update the information for this prospect." : "Log client details for sales tracking."}</p>
              </div>
              <button onClick={() => { setIsCreateOpen(false); setIsEditMode(false); setEditingLeadId(null); }} className="rounded-lg p-2 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateLead} className="flex-1 flex flex-col justify-between">
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                {formError && (
                  <div className="col-span-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                    {formError}
                  </div>
                )}
                
                <label className="text-sm font-semibold text-slate-700 col-span-2">
                  Company Name <span className="text-rose-500">*</span>
                  <input
                    value={formCompany}
                    onChange={e => setFormCompany(e.target.value)}
                    placeholder="Search or enter company name"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3 col-span-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Contact Person <span className="text-rose-500">*</span>
                    <input
                      value={formContact}
                      onChange={e => setFormContact(e.target.value)}
                      placeholder="Person name"
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-700">
                    Contact Phone Number <span className="text-rose-500">*</span>
                    <input
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="Number"
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 col-span-2">
                  <label className="text-sm font-semibold text-slate-700">
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

                  {matchedCustomer ? (
                    <div className="flex flex-col justify-end">
                      <label className="text-sm font-semibold text-slate-700">
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
                        <label className="text-sm font-semibold text-slate-700 mt-2">
                          New Branch Name <span className="text-rose-500">*</span>
                          <input
                            value={formBranch}
                            onChange={e => setFormBranch(e.target.value)}
                            placeholder="e.g. GIDC Unit 2"
                            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                            required
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <label className="text-sm font-semibold text-slate-700">
                      Branch Name <span className="text-rose-500">*</span>
                      <input
                        value={formBranch}
                        onChange={e => setFormBranch(e.target.value)}
                        placeholder="e.g. GIDC Unit 2"
                        className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                        required
                      />
                    </label>
                  )}
                </div>

                <label className="text-sm font-semibold text-slate-700 col-span-2">
                  Detailed Address
                  <textarea
                    value={formAddress}
                    onChange={e => setFormAddress(e.target.value)}
                    placeholder="Address coordinates or landmark details..."
                    className="mt-1.5 min-h-[70px] w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#5b8d65] resize-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3 col-span-2">
                  {currentUserRole === "Owner" ? (
                    <label className="text-sm font-semibold text-slate-700">
                      Assigned Salesperson <span className="text-rose-500">*</span>
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
                  ) : (
                    <label className="text-sm font-semibold text-slate-700">
                      Assigned Salesperson
                      <input
                        value={formSalesperson || currentSimulatedUser}
                        disabled
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none text-slate-500 cursor-not-allowed"
                      />
                    </label>
                  )}

                  <label className="text-sm font-semibold text-slate-700">
                    GST Number (Optional)
                    <input
                      value={formGstNumber}
                      onChange={e => setFormGstNumber(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65] uppercase"
                      placeholder="e.g. 27ABCDE1234F1Z5"
                    />
                  </label>
                </div>

                {currentUserRole === "Owner" && (
                  <div className="grid grid-cols-2 gap-3 col-span-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Status <span className="text-rose-500">*</span>
                      <select
                        value={formStatus}
                        onChange={e => setFormStatus(e.target.value as Lead["status"])}
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                      >
                        <option value="New">New</option>
                        <option value="In Quotation">In Quotation</option>
                        <option value="In Discussion">In Discussion</option>
                        <option value="Win">Win</option>
                        <option value="Lost">Lost</option>
                        <option value="Disqualified">Disqualified</option>
                      </select>
                    </label>

                    <label className="text-sm font-semibold text-slate-700">
                      Created At
                      <input
                        type="datetime-local"
                        value={formCreatedAt}
                        onChange={e => setFormCreatedAt(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                      />
                    </label>
                  </div>
                )}

                {(formStatus === "Lost" || formStatus === "Disqualified") && (
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">
                      Specify Reason <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={statusReason}
                      onChange={e => setStatusReason(e.target.value)}
                      placeholder={formStatus === "Lost" ? "e.g. Lost to competitor" : "e.g. Client has no power sanction"}
                      className="mt-1 w-full min-h-[60px] rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#5b8d65] resize-none"
                    />
                  </div>
                )}
                
                {/* Product Selection Sub-form */}
                <div className="col-span-2 border-t pt-4 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-800">Select Products {["In Quotation", "In Discussion", "Win"].includes(formStatus) && <span className="text-rose-500">*</span>}</h3>
                    <Button
                      type="button"
                      onClick={() => setFormProducts([...formProducts, { productId: "", quantity: 1, invoiceAmount: 0 }])}
                      variant="outline"
                      size="sm"
                      className="text-xs flex items-center gap-1 py-1 px-2.5 border-slate-300 rounded-lg bg-white hover:bg-slate-50 shadow-sm"
                    >
                      <Plus size={12} /> Add Product
                    </Button>
                  </div>

                  {formProducts.map((p, idx) => {
                    const isProductRequired = ["In Quotation", "In Discussion", "Win"].includes(formStatus);
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

                  <div className="mt-3.5 text-right bg-slate-50 p-2.5 rounded-lg border text-xs font-bold text-slate-700">
                    Total Lead Value: <span className="text-emerald-700 text-sm font-extrabold">₹{formProducts.reduce((sum, p) => sum + (p.quantity * p.invoiceAmount), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t p-5 bg-slate-50/50 sticky bottom-0 bg-white z-10">
                <Button type="button" onClick={() => { setIsCreateOpen(false); setIsEditMode(false); setEditingLeadId(null); }} variant="ghost" className="text-slate-650 rounded-xl">
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
                  {["New", "In Quotation", "In Discussion", "Win", "Lost", "Disqualified", "Converted"].map(status => (
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

                {/* Attachments for Follow Up */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Attach Image Link</label>
                    <input
                      type="text"
                      placeholder="e.g. image.jpg"
                      value={followUpPhoto || ""}
                      onChange={e => setFollowUpPhoto(e.target.value || null)}
                      className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#5b8d65]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Attach Voice Note</label>
                    <input
                      type="text"
                      placeholder="e.g. 0:30"
                      value={followUpVoice || ""}
                      onChange={e => setFollowUpVoice(e.target.value || null)}
                      className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#5b8d65]"
                    />
                  </div>
                </div>
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

      {/* ASK FOR QUOTE MODAL */}
      {isAskQuoteOpen && selectedLeadDetails && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-[#173c2d]" />
                Ask for Quotation
              </h3>
              <button onClick={() => setIsAskQuoteOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const requestedTypes = [];
              if (askQuoteTech) requestedTypes.push("Technical");
              if (askQuoteBank) requestedTypes.push("Bank");
              if (requestedTypes.length === 0) {
                alert("Please select at least one quotation type.");
                return;
              }
              await addQuotationRequest({
                leadId: selectedLeadDetails.id,
                requestedTypes,
                notes: askQuoteNotes,
                photo: askQuotePhoto || undefined,
                voiceNote: askQuoteVoice || undefined
              });
              
              const updated = leads.find(l => l.id === selectedLeadDetails.id);
              if (updated) setSelectedLeadDetails(updated);
              setIsAskQuoteOpen(false);
            }}>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Select Types</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={askQuoteTech}
                        onChange={e => setAskQuoteTech(e.target.checked)}
                        className="rounded border-slate-350 text-[#173c2d] focus:ring-[#5b8d65]"
                      />
                      Technical Quotation
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={askQuoteBank}
                        onChange={e => setAskQuoteBank(e.target.checked)}
                        className="rounded border-slate-350 text-[#173c2d] focus:ring-[#5b8d65]"
                      />
                      Bank Quotation
                    </label>
                  </div>
                </div>

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Notes / Details
                  <textarea
                    rows={3}
                    value={askQuoteNotes}
                    onChange={e => setAskQuoteNotes(e.target.value)}
                    placeholder="Provide any instructions or description..."
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65] resize-none"
                  />
                </label>

                {/* Attachments */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Attach Image Link</label>
                    <input
                      type="text"
                      placeholder="e.g. image.jpg"
                      value={askQuotePhoto || ""}
                      onChange={e => setAskQuotePhoto(e.target.value || null)}
                      className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#5b8d65]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Attach Voice Note</label>
                    <input
                      type="text"
                      placeholder="e.g. 0:30"
                      value={askQuoteVoice || ""}
                      onChange={e => setAskQuoteVoice(e.target.value || null)}
                      className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#5b8d65]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                <Button type="button" onClick={() => setIsAskQuoteOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4">
                  Request Quotation
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
    </>
  );
};
