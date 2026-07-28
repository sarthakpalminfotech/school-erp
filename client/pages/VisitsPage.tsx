import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, MapPin, Phone, User, Calendar, Check, X, CalendarClock, ChevronDown, Edit2, Play, CheckSquare, PhoneCall, ArrowLeft } from "lucide-react";
import { useAppState, Visit } from "@/hooks/useAppState";
import { NotesComponent } from "@/components/NotesComponent";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export interface SearchableSelectOption {
  label: string;
  value: string;
  sublabel?: string;
}

export const SearchableSelect: React.FC<{
  options: SearchableSelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}> = ({ options, value, onChange, placeholder = "Select...", disabled = false, required = false, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(o => 
      o.label.toLowerCase().includes(term) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(term))
    );
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm("");
          }
        }}
        className={`w-full text-left rounded-lg border border-slate-200 bg-white p-2.5 flex items-center justify-between text-xs transition ${
          disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'hover:border-slate-300'
        } ${isOpen ? 'ring-2 ring-[#173c2d]/20 border-[#173c2d]' : ''}`}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
      </button>

      {required && (
        <input
          tabIndex={-1}
          className="opacity-0 absolute inset-0 pointer-events-none"
          value={value}
          onChange={() => {}}
          required
        />
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in duration-100">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Type to search..."
              className="w-full bg-transparent text-xs outline-none text-slate-800 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`p-2 rounded-md cursor-pointer text-xs transition flex flex-col ${
                    opt.value === value
                      ? 'bg-[#173c2d]/10 text-[#173c2d] font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.sublabel && <span className="text-[10px] text-slate-400 font-normal">{opt.sublabel}</span>}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 italic">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const VisitsPage: React.FC = () => {
  const navigate = useNavigate();
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
    orders,
    currentUserRole,
    currentSimulatedUser,
    hasWritePermission,
    updateOrderStatus,
    updateOrderDetails,
    uploadServiceReport,
    serviceCycles,
    completeServiceCheckup,
    completeMajorService,
    uploadServiceQuotation,
    inventory,
    assignServiceTrackEngineer,
    suppliers
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
  const [formVisitType, setFormVisitType] = useState<Visit['visitType']>('Sales');
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
  const [formOrderId, setFormOrderId] = useState("");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formLogPhoto, setFormLogPhoto] = useState<string | null>(null);
  const [formLogVoice, setFormLogVoice] = useState<string | null>(null);

  // Delivery Warning Popup State
  const [showDeliveryWarning, setShowDeliveryWarning] = useState(false);
  const [pendingVisitPayload, setPendingVisitPayload] = useState<any>(null);
  const [deliveryWarningStatus, setDeliveryWarningStatus] = useState<string>("");

  // Log Visit Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logVisitId, setLogVisitId] = useState<string | null>(null);
  const [logStatus, setLogStatus] = useState<Visit["status"] | "">("");
  const [logNotes, setLogNotes] = useState("");
  const [logPhoto, setLogPhoto] = useState<string | null>(null);
  const [logVoice, setLogVoice] = useState<string | null>(null);
  const [logFollowUpDate, setLogFollowUpDate] = useState("");
  const [logReason, setLogReason] = useState("");
  const [deliveryCompleted, setDeliveryCompleted] = useState(false);
  const [commissioningDone, setCommissioningDone] = useState(false);
  const [commissioningReportFile, setCommissioningReportFile] = useState<File | null>(null);

  // Service Visit Form & Log States
  const [formServiceType, setFormServiceType] = useState<'Checkup' | 'Major'>('Checkup');
  const [serviceDone, setServiceDone] = useState(false);
  const [serviceIssueFound, setServiceIssueFound] = useState(false);
  const [serviceCheckupReportFile, setServiceCheckupReportFile] = useState<File | null>(null);
  const [serviceQuotationFile, setServiceQuotationFile] = useState<File | null>(null);
  const [servicePreReportFile, setServicePreReportFile] = useState<File | null>(null);
  const [servicePostReportFile, setServicePostReportFile] = useState<File | null>(null);
  const [servicePartsUsed, setServicePartsUsed] = useState<{ partId: string; qty: number }[]>([]);
  const [serviceSelectedPartId, setServiceSelectedPartId] = useState("");
  const [serviceSelectedPartQty, setServiceSelectedPartQty] = useState("1");
  const [serviceCheckupReportName, setServiceCheckupReportName] = useState("");
  const [serviceQuotationName, setServiceQuotationName] = useState("");
  const [servicePreReportName, setServicePreReportName] = useState("");
  const [servicePostReportName, setServicePostReportName] = useState("");

  const loggingVisitObj = useMemo(() => {
    return visits.find(v => v.id === logVisitId) || null;
  }, [visits, logVisitId]);

  const isSalesVisit = !loggingVisitObj || loggingVisitObj.visitType === 'Sales';
  
  // Audio recording/photo mock simulation inside Log Outcome popup
  const [isRecording, setIsRecording] = useState(false);

  // Details Tabs
  const [detailsTab, setDetailsTab] = useState<"notes" | "activity">("notes");
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Filtered Visits List
  const filteredVisits = useMemo(() => {
    return (visits || []).filter(v => {
      if (v.visitType !== 'Sales' && (v.status === 'Completed' || v.status === 'Issue Found')) {
        return false;
      }
      const matchesQuery = `${v.companyName} ${v.contactPerson || ""} ${v.city || ""}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = !statusFilter || v.status === statusFilter;
      const matchesSales = !salesFilter || v.salesperson === salesFilter;
      const matchesRole = (currentUserRole === "Owner" || currentUserRole === "Receptionist")
        ? true
        : v.salesperson === currentSimulatedUser;
      return matchesQuery && matchesStatus && matchesSales && matchesRole;
    });
  }, [visits, query, statusFilter, salesFilter, currentUserRole, currentSimulatedUser]);

  // Set default salesperson for form based on role
  useEffect(() => {
    if (currentUserRole !== "Owner") {
      setFormSalesperson(currentSimulatedUser);
    } else if (employees.length > 0 && !formSalesperson) {
      setFormSalesperson(employees[0].name);
    }
  }, [currentUserRole, currentSimulatedUser, employees, formSalesperson]);

  const getOrderLastServiceInfo = (orderId: string) => {
    const sc = serviceCycles.find(s => s.orderId === orderId);
    if (!sc) return "Last Service: None";
    
    const checkupDate = sc.lastCheckupDate ? new Date(sc.lastCheckupDate) : null;
    const majorDate = sc.lastMajorServiceDate ? new Date(sc.lastMajorServiceDate) : null;
    
    if (!checkupDate && !majorDate) {
      return "Last Service: None";
    }
    
    if (checkupDate && (!majorDate || checkupDate >= majorDate)) {
      return `Last Service: ${checkupDate.toLocaleDateString('en-IN')} (Checkup)`;
    } else if (majorDate && (!checkupDate || majorDate > checkupDate)) {
      return `Last Service: ${majorDate.toLocaleDateString('en-IN')} (Major Service)`;
    }
    
    return "Last Service: None";
  };

  // Auto-filtering suggestions for customer selection
  const companySuggestions = useMemo(() => {
    if (!formCompany?.trim()) return [];
    const term = (formCompany || "").toLowerCase();
    return customers.filter(c => 
      (c.name || "").toLowerCase().includes(term) ||
      (c.contactPerson || "").toLowerCase().includes(term)
    );
  }, [formCompany, customers]);

  const handleOrderSelectionChange = (orderId: string) => {
    setFormOrderId(orderId);
    if (!orderId) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (formVisitType === 'Delivery') {
      if (order.deliveryPartner) {
        setFormSalesperson(order.deliveryPartner);
      }
    } else if (formVisitType === 'Commissioning' || formVisitType === 'Service') {
      if (order.assignedEngineer) {
        setFormSalesperson(order.assignedEngineer);
      }
    }
  };

  const handleSelectCustomer = (customer: typeof customers[0]) => {
    setFormCompany(customer.name);
    const branchName = customer.branches?.[0] || "";
    setFormBranch(branchName);
    
    const bDetail = customer.branchDetails?.find(b => b.name === branchName);
    if (bDetail) {
      setFormContact(bDetail.contactPerson || customer.contactPerson || "");
      setFormPhone(bDetail.phone || customer.phone || "");
      setFormAddress(bDetail.address || customer.address || "");
    } else {
      setFormContact(customer.contactPerson || "");
      setFormPhone(customer.phone || "");
      setFormAddress(customer.address || "");
    }
    
    setFormCity(customer.city || "Ahmedabad");
    setShowCompanySuggestions(false);

    const custOrders = orders.filter(o => 
      (o.companyName || "").toLowerCase() === (customer.name || "").toLowerCase() &&
      (formVisitType === 'Service' ? o.status === "Commissioned/Completed" : true)
    );
    if (custOrders.length === 1) {
      handleOrderSelectionChange(custOrders[0].id);
    } else {
      setFormOrderId("");
    }
  };

  const handleBranchChange = (branchName: string) => {
    setFormBranch(branchName);
    const cust = customers.find(c => (c.name || "").toLowerCase() === (formCompany || "").toLowerCase());
    if (cust && cust.branchDetails) {
      const bDetail = cust.branchDetails.find(b => b.name.toLowerCase() === branchName.toLowerCase());
      if (bDetail) {
        if (bDetail.contactPerson) setFormContact(bDetail.contactPerson);
        if (bDetail.phone) setFormPhone(bDetail.phone);
        if (bDetail.address) setFormAddress(bDetail.address);
      }
    }
  };



  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim()) return alert("Company name is required.");
    if (!formScheduledDate) return alert("Scheduled Date & Time is mandatory.");
    if (formVisitType === 'Sales') {
      if (!formContact.trim()) return alert("Contact Person name is required for Sales visits.");
      if (!formPhone.trim()) return alert("Contact Phone Number is required for Sales visits.");
    }
    if ((formVisitType === 'Delivery' || formVisitType === 'Commissioning' || formVisitType === 'Service') && !formOrderId) {
      return alert(`Order selection is required for ${formVisitType} visits.`);
    }

    const visitPayload = {
      visitType: formVisitType,
      serviceType: formVisitType === 'Service' ? formServiceType : undefined,
      companyName: formCompany,
      contactPerson: formContact || undefined,
      phone: formPhone || undefined,
      city: formCity || undefined,
      address: formAddress || undefined,
      branch: formBranch || undefined,
      orderId: formOrderId || undefined,
      supplierId: formVisitType === 'Delivery' ? (formSupplierId || undefined) : undefined,
      productsSelected: (formVisitType === 'Delivery' && formOrderId) ? (orders.find(o => o.id === formOrderId)?.productsSelected || []) : [],
      salesperson: formSalesperson || currentSimulatedUser,
      scheduledAt: formScheduledDate ? new Date(formScheduledDate).toISOString() : undefined,
      notesText: formNotes || undefined,
      notesPhoto: formLogPhoto || undefined,
      notesVoice: formLogVoice || undefined
    };

    if (formVisitType === 'Delivery' && formOrderId) {
      const selectedOrd = orders.find(o => o.id === formOrderId);
      if (selectedOrd && selectedOrd.status !== "Order Placed with Supplier") {
        setDeliveryWarningStatus(selectedOrd.status);
        setPendingVisitPayload(visitPayload);
        setShowDeliveryWarning(true);
        return;
      }
    }

    await executeSaveVisit(visitPayload);
  };

  const executeSaveVisit = async (payload: any) => {
    if (editingVisit) {
      await updateVisit(editingVisit.id, payload);
    } else {
      await addVisit(payload);
    }

    if (payload.orderId) {
      if (payload.visitType === 'Delivery') {
        await updateOrderDetails(payload.orderId, {
          deliveryPartner: payload.salesperson || null,
          deliveryDate: payload.scheduledAt || null,
          supplierId: payload.supplierId || null,
          status: "Order Placed with Supplier",
          skipVisitCreation: true
        });
      } else if (payload.visitType === 'Commissioning') {
        await updateOrderDetails(payload.orderId, {
          assignedEngineer: payload.salesperson || null,
          deliveryDate: payload.scheduledAt || null,
          skipVisitCreation: true
        });
      } else if (payload.visitType === 'Service') {
        await updateOrderDetails(payload.orderId, {
          assignedEngineer: payload.salesperson || null,
          deliveryDate: payload.scheduledAt || null,
          skipVisitCreation: true
        });
        if (assignServiceTrackEngineer) {
          await assignServiceTrackEngineer(payload.orderId, payload.serviceType === 'Major' ? 'Major' : 'Checkup', payload.salesperson || null);
        }
      }
    }

    setIsFormModalOpen(false);
    resetForm();
    setShowDeliveryWarning(false);
    setPendingVisitPayload(null);
  };

  const resetForm = () => {
    setEditingVisit(null);
    if (currentUserRole === "Service Engineer") {
      setFormVisitType('Commissioning');
    } else {
      setFormVisitType('Sales');
    }
    setFormServiceType('Checkup');
    setFormCompany("");
    setFormContact("");
    setFormPhone("");
    setFormCity("Ahmedabad");
    setFormAddress("");
    setFormBranch("");
    setFormScheduledDate("");
    setFormNotes("");
    setFormOrderId("");
    setFormSupplierId("");
    setFormLogPhoto(null);
    setFormLogVoice(null);
    if (currentUserRole !== "Owner") {
      setFormSalesperson(currentSimulatedUser);
    } else {
      setFormSalesperson("");
    }
  };

  const handleOpenEdit = (v: Visit) => {
    setEditingVisit(v);
    setFormVisitType(v.visitType || 'Sales');
    setFormServiceType(v.serviceType || 'Checkup');
    setFormCompany(v.companyName);
    setFormContact(v.contactPerson || "");
    setFormPhone(v.phone || "");
    setFormCity(v.city || "Ahmedabad");
    setFormAddress(v.address || "");
    setFormBranch(v.branch || "");
    setFormOrderId(v.orderId || "");
    setFormSupplierId(v.supplierId || "");
    setFormSalesperson(v.salesperson || "");
    setFormScheduledDate(v.scheduledAt ? new Date(v.scheduledAt).toISOString().slice(0, 16) : "");
    setFormNotes("");
    setFormLogPhoto(null);
    setFormLogVoice(null);
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
    const activeLogVisitObj = visits.find(v => v.id === logVisitId);
    const isSalesVisit = !activeLogVisitObj || activeLogVisitObj.visitType === 'Sales';

    if (isSalesVisit) {
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
    } else {
      if (activeLogVisitObj?.visitType === 'Delivery') {
        if (!deliveryCompleted && !commissioningDone) {
          return alert("Please check Delivery Completed or Commissioning Done to proceed.");
        }
      } else if (activeLogVisitObj?.visitType === 'Commissioning') {
        if (!commissioningDone) {
          return alert("Please check Commissioning Done to proceed.");
        }
      } else if (activeLogVisitObj?.visitType === 'Service') {
        if (!serviceDone) {
          return alert("Please check Service Done to proceed.");
        }
      }
    }

    if (activeLogVisitObj && (activeLogVisitObj.visitType === 'Delivery' || activeLogVisitObj.visitType === 'Commissioning') && activeLogVisitObj.orderId) {
      if (commissioningDone) {
        const assocOrder = orders.find(o => o.id === activeLogVisitObj.orderId);
        if (assocOrder && !assocOrder.gstNumber) {
          return alert("GST Number is compulsory on the order before it can be marked as Commissioned/Completed.");
        }
        await updateOrderStatus(activeLogVisitObj.orderId, "Commissioned/Completed");
        if (commissioningReportFile) {
          await uploadServiceReport(activeLogVisitObj.orderId, "Checkup", commissioningReportFile);
        }
      } else if (deliveryCompleted && activeLogVisitObj.visitType === 'Delivery') {
        await updateOrderStatus(activeLogVisitObj.orderId, "Commissioning Pending");
      }
    }

    if (activeLogVisitObj && activeLogVisitObj.visitType === 'Service' && activeLogVisitObj.orderId) {
      if (serviceDone) {
        if (activeLogVisitObj.serviceType === 'Major') {
          const finalPre = servicePreReportName.trim() || "Pre-Service Report";
          const finalPost = servicePostReportName.trim() || "Post-Service Report";
          await completeMajorService(
            activeLogVisitObj.orderId,
            finalPre,
            finalPost,
            servicePartsUsed,
            activeLogVisitObj.salesperson || currentSimulatedUser
          );
        } else {
          const finalReport = serviceCheckupReportName.trim() || "Checkup Report";
          await completeServiceCheckup(
            activeLogVisitObj.orderId,
            finalReport,
            activeLogVisitObj.salesperson || currentSimulatedUser
          );
          if (serviceIssueFound && serviceQuotationName.trim()) {
            await uploadServiceQuotation(activeLogVisitObj.orderId, serviceQuotationName.trim());
          }
        }
      }
    }

    if (logVisitId) {
      let finalStatus: Visit["status"];
      if (isSalesVisit) {
        finalStatus = logStatus as Visit["status"];
      } else if (
        activeLogVisitObj?.visitType === 'Service' &&
        activeLogVisitObj.serviceType === 'Checkup' &&
        serviceIssueFound
      ) {
        finalStatus = 'Issue Found';
      } else {
        finalStatus = 'Completed';
      }
      await logVisit(logVisitId, {
        status: finalStatus,
        notesText: logNotes,
        photo: logPhoto || undefined,
        voiceNote: logVoice || undefined,
        followUpDate: logFollowUpDate ? new Date(logFollowUpDate).toISOString() : undefined,
        reason: logNotes
      });
    }

    closeLogModal();
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
    setLogVisitId(null);
    setLogStatus("");
    setLogNotes("");
    setLogPhoto(null);
    setLogVoice(null);
    setLogFollowUpDate("");
    setLogReason("");
    setDeliveryCompleted(false);
    setCommissioningDone(false);
    setCommissioningReportFile(null);
    setServiceDone(false);
    setServiceIssueFound(false);
    setServiceCheckupReportFile(null);
    setServiceQuotationFile(null);
    setServicePreReportFile(null);
    setServicePostReportFile(null);
    setServicePartsUsed([]);
    setServiceSelectedPartId("");
    setServiceSelectedPartQty("1");
    setServiceCheckupReportName("");
    setServiceQuotationName("");
    setServicePreReportName("");
    setServicePostReportName("");
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
      case "Issue Found": return "bg-orange-100 text-orange-800 border-orange-300";
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
          <button onClick={() => setSelectedVisitId(null)} className="text-[#173c2d] font-semibold text-sm flex items-center gap-1.5">
            <ArrowLeft size={15} /> Back to list
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
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 animate-pulse">
                    {selectedVisit.startedBy === currentSimulatedUser
                      ? `Ongoing (${selectedVisit.startedBy})`
                      : "Ongoing"}
                  </span>
                  {(!selectedVisit.startedBy || selectedVisit.startedBy === currentSimulatedUser) && (
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
                  )}
                </div>
              ) : selectedVisit.visitType === 'Sales' ? (
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
              ) : (
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${getStatusBadgeStyles(selectedVisit.status)}`}>
                  {selectedVisit.status}
                </span>
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
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Visit Type</p>
              <p className="mt-0.5 text-slate-800 font-medium">{selectedVisit.visitType || "Sales"} Visit</p>
            </div>
            {selectedVisit.visitType === 'Delivery' && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Supplier</p>
                <p className="mt-0.5 text-slate-800 font-medium">
                  {suppliers.find(s => s.id === selectedVisit.supplierId)?.name || selectedVisit.supplierId || "-"}
                </p>
              </div>
            )}
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
            {selectedVisit.orderId && (
              <div className="col-span-2 flex items-center justify-between bg-slate-100 p-2.5 rounded-lg border border-slate-200 mt-1">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Associated Order</p>
                  <p className="text-xs font-bold text-slate-800">{selectedVisit.orderId}</p>
                </div>
                <button
                  onClick={() => {
                    navigate(`/orders?orderId=${selectedVisit.orderId}`);
                  }}
                  className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-[10px] font-bold py-1.5 px-3 rounded transition shadow-sm"
                >
                  See Order Details
                </button>
              </div>
            )}
          </div>

          {/* Contextual products selected list */}
          <div className="border-t border-slate-200/80 pt-3 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {selectedVisit.visitType === 'Sales' ? "Interested Products" : "Products Selected"}
            </h3>
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
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 animate-pulse">
                        {visit.startedBy === currentSimulatedUser
                          ? `Ongoing (${visit.startedBy})`
                          : "Ongoing"}
                      </span>
                      {(!visit.startedBy || visit.startedBy === currentSimulatedUser) && (
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
                      )}
                    </div>
                  ) : visit.visitType === 'Sales' ? (
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
                  ) : (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusBadgeStyles(visit.status)}`}>
                      {visit.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Meta details */}
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs text-slate-500/90 font-medium">
                <div className="col-span-2 text-[#173c2d] font-bold text-[10px] uppercase tracking-wider bg-[#173c2d]/10 inline-block px-2 py-0.5 rounded w-fit mb-1">{visit.visitType || 'Sales'} Visit</div>
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
                <SearchableSelect
                  options={[
                    { label: "All Statuses", value: "" },
                    { label: "Pending", value: "Pending" },
                    { label: "Started", value: "Started" },
                    { label: "In communication", value: "In communication" },
                    { label: "Unavailable", value: "Unavailable" },
                    { label: "Postponed", value: "Postponed" },
                    { label: "Disqualified", value: "Disqualified" },
                    { label: "Convert to lead", value: "Convert to lead" },
                    { label: "Lost", value: "Lost" }
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="All Statuses"
                  className="mt-1.5"
                />
              </label>

              {currentUserRole === "Owner" && (
                <label className="block font-semibold text-slate-650">
                  Salesperson Representative
                  <SearchableSelect
                    options={[
                      { label: "All Representatives", value: "" },
                      ...employees.filter(e => e.role === "Sales Person" || e.role === "Owner" || e.role === "Service Engineer").map(emp => ({
                        label: `${emp.name} (${emp.role})`,
                        value: emp.name
                      }))
                    ]}
                    value={salesFilter}
                    onChange={setSalesFilter}
                    placeholder="All Representatives"
                    className="mt-1.5"
                  />
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
              {/* Visit Type Toggle */}
              {currentUserRole !== "Sales Person" && (
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  {(currentUserRole === "Service Engineer"
                    ? (['Commissioning', 'Service'] as const)
                    : (['Sales', 'Delivery', 'Commissioning', 'Service'] as const)
                  ).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormVisitType(type)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                        formVisitType === type 
                          ? 'bg-white shadow-sm text-slate-800' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}

              {formVisitType === 'Service' && (
                <div className="flex gap-4 p-2 bg-slate-50 border rounded-lg items-center justify-around">
                  <span className="font-semibold text-slate-700 text-xs">Service Type:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-850 text-xs">
                    <input
                      type="radio"
                      name="serviceType"
                      checked={formServiceType === 'Checkup'}
                      onChange={() => setFormServiceType('Checkup')}
                      className="text-[#173c2d] focus:ring-[#173c2d]"
                    />
                    Checkup Visit
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-850 text-xs">
                    <input
                      type="radio"
                      name="serviceType"
                      checked={formServiceType === 'Major'}
                      onChange={() => setFormServiceType('Major')}
                      className="text-[#173c2d] focus:ring-[#173c2d]"
                    />
                    Main Service
                  </label>
                </div>
              )}

              {/* Company Selection Combobox */}
              {formVisitType === 'Sales' ? (
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
                          {cust.name} ({cust.city || "-"}) - {cust.contactPerson || "No Contact"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={customers
                      .filter(c => 
                        formVisitType === 'Service' 
                          ? orders.some(o => (o.companyName || "").toLowerCase() === (c.name || "").toLowerCase() && o.status === "Commissioned/Completed")
                          : true
                      )
                      .map(c => ({
                        label: `${c.name} (${c.city || "-"}) - ${c.contactPerson || "No Contact"}`,
                        value: c.name
                      }))}
                    value={formCompany}
                    onChange={(val) => {
                      const c = customers.find(x => x.name === val);
                      if (c) handleSelectCustomer(c);
                      else setFormCompany(val);
                    }}
                    placeholder="Search & select company..."
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">
                  Contact Person {formVisitType === 'Sales' && <span className="text-rose-500">*</span>}
                  <input
                    value={formContact}
                    onChange={e => setFormContact(e.target.value)}
                    placeholder="Person name"
                    className={`mt-1 w-full rounded-lg border border-slate-200 p-2.5 ${formVisitType !== 'Sales' ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
                    required={formVisitType === 'Sales'}
                    readOnly={formVisitType !== 'Sales'}
                  />
                </label>
                <label className="block font-semibold text-slate-700">
                  Contact Phone Number {formVisitType === 'Sales' && <span className="text-rose-500">*</span>}
                  <input
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="Number"
                    className={`mt-1 w-full rounded-lg border border-slate-200 p-2.5 ${formVisitType !== 'Sales' ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
                    required={formVisitType === 'Sales'}
                    readOnly={formVisitType !== 'Sales'}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">
                  City
                  {formVisitType === 'Sales' ? (
                    <select
                      value={formCity}
                      onChange={e => setFormCity(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                    >
                      {cities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <SearchableSelect
                      options={cities.map(c => ({ label: c, value: c }))}
                      value={formCity}
                      onChange={setFormCity}
                      placeholder="Select city..."
                      className="mt-1"
                    />
                  )}
                </label>

                <label className="block font-semibold text-slate-700">
                  Branch Name
                  {formVisitType === 'Sales' ? (
                    <>
                      <input
                        list="branch-options"
                        value={formBranch}
                        onChange={e => handleBranchChange(e.target.value)}
                        placeholder="e.g. GIDC Unit 2"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                      />
                      <datalist id="branch-options">
                        {(customers.find(c => (c.name || "").toLowerCase() === (formCompany || "").toLowerCase())?.branches || []).map(b => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <SearchableSelect
                      options={(customers.find(c => (c.name || "").toLowerCase() === (formCompany || "").toLowerCase())?.branches || []).map(b => ({ label: b, value: b }))}
                      value={formBranch}
                      onChange={handleBranchChange}
                      placeholder="Select branch..."
                      className="mt-1"
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
                  className={`mt-1 w-full rounded-lg border border-slate-200 p-2.5 h-12 resize-none ${formVisitType !== 'Sales' ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
                  readOnly={formVisitType !== 'Sales'}
                />
              </label>

              {formVisitType !== 'Sales' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Select Order <span className="text-rose-500">*</span>
                    </label>
                    <SearchableSelect
                      options={orders
                        .filter(o => 
                          (o.companyName || "").toLowerCase() === (formCompany || "").toLowerCase() &&
                          (formVisitType === 'Service' ? o.status === "Commissioned/Completed" : true)
                        )
                        .map(o => {
                          if (formVisitType === 'Service') {
                            return {
                              label: `${o.id} - ${getOrderLastServiceInfo(o.id)}`,
                              value: o.id
                            };
                          } else {
                            const rawDate = o.createdAt || o.deliveryDate;
                            const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : 'N/A';
                            return {
                              label: `${o.id} - Date: ${formattedDate} - Status: ${o.status}`,
                              value: o.id
                            };
                          }
                        })}
                      value={formOrderId}
                      onChange={handleOrderSelectionChange}
                      placeholder="Search & select an order..."
                      required
                    />
                  </div>

                  {formVisitType === 'Delivery' && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Select Supplier <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={suppliers.map(s => ({
                          label: s.name,
                          value: s.id,
                          sublabel: s.city ? `City: ${s.city}` : undefined
                        }))}
                        value={formSupplierId}
                        onChange={setFormSupplierId}
                        placeholder="Search & select a supplier..."
                        required
                      />
                    </div>
                  )}
                  
                  {formOrderId && (() => {
                    const order = orders.find(o => o.id === formOrderId);
                    if (!order) return null;
                    const rawDate = order.createdAt || order.deliveryDate;
                    const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : 'N/A';
                    return (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-semibold text-slate-700">Order Date: {formattedDate}</span>
                          <span className="font-bold text-[#173c2d] uppercase">{order.status}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-600 block mb-1">Products:</span>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {(order.productsSelected || []).map((p, i) => (
                              <li key={i}>{p.productName} (x{p.quantity})</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {currentUserRole === "Owner" ? (
                  <label className="block font-semibold text-slate-700">
                    Assigned {formVisitType === 'Delivery' || formVisitType === 'Commissioning' || formVisitType === 'Service' ? 'Engineer' : 'Salesperson'}
                    {formVisitType === 'Sales' ? (
                      <select
                        value={formSalesperson}
                        onChange={e => setFormSalesperson(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                      >
                        <option value="">Select salesperson...</option>
                        {employees
                          .filter(e => e.role === "Sales Person" || e.role === "Owner")
                          .map(emp => (
                            <option key={emp.name} value={emp.name}>{emp.name}</option>
                          ))}
                      </select>
                    ) : (
                      <SearchableSelect
                        options={employees
                          .filter(e => e.role === (formVisitType === 'Delivery' || formVisitType === 'Commissioning' || formVisitType === 'Service' ? 'Service Engineer' : 'Sales Person'))
                          .map(emp => ({ label: emp.name, value: emp.name }))}
                        value={formSalesperson}
                        onChange={setFormSalesperson}
                        placeholder={`Select ${formVisitType === 'Delivery' || formVisitType === 'Commissioning' || formVisitType === 'Service' ? 'Engineer' : 'Salesperson'}...`}
                        className="mt-1"
                      />
                    )}
                  </label>
                ) : (
                  <div>
                    <span className="block font-semibold text-slate-400">Representative</span>
                    <p className="mt-2 text-slate-800 font-bold">{currentSimulatedUser}</p>
                  </div>
                )}

                <label className="block font-semibold text-slate-700">
                  Scheduled Date & Time <span className="text-rose-500">*</span>
                  <input
                    type="datetime-local"
                    value={formScheduledDate}
                    onChange={e => setFormScheduledDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2"
                    required
                  />
                </label>
              </div>

              {!editingVisit && (
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700">
                    Initial Log/Visit Notes
                    <textarea
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      placeholder="Any initial instructions, context or notes for scheduling..."
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 h-12 resize-none"
                    />
                  </label>

                  {formVisitType === 'Delivery' && (
                    <>
                      {(formLogPhoto || formLogVoice || isRecording) && (
                        <div className="flex flex-wrap gap-2.5 border-t border-slate-100 pt-2">
                          {formLogPhoto && (
                            <div className="relative group rounded-lg overflow-hidden border bg-white p-1">
                              <img src={formLogPhoto} alt="Outcome Photo" className="h-10 w-14 object-cover rounded" />
                              <button onClick={() => setFormLogPhoto(null)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                                <X size={8} />
                              </button>
                            </div>
                          )}
                          {formLogVoice && (
                            <div className="flex items-center gap-1.5 rounded-lg border bg-white px-2 py-1 text-[10px] text-slate-600">
                              <span>{formLogVoice}</span>
                              <button onClick={() => setFormLogVoice(null)} className="text-slate-400 hover:text-red-500">
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
                      
                      <div className="flex gap-2 text-slate-500">
                        <button
                          type="button"
                          onClick={() => setFormLogPhoto("https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80")}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1 transition text-xs"
                        >
                          📷 Photo
                        </button>
                        <button
                          type="button"
                          disabled={isRecording}
                          onClick={() => {
                            setIsRecording(true);
                            setTimeout(() => {
                              setIsRecording(false);
                              setFormLogVoice("Voice Note (0:12s)");
                            }, 3000);
                          }}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1 transition text-xs disabled:opacity-50"
                        >
                          🎤 Voice
                        </button>
                      </div>
                    </>
                  )}
                </div>
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
                onClick={closeLogModal}
                className="text-slate-400 hover:text-slate-650"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {loggingVisitObj?.visitType === 'Delivery' && (
                <div className="space-y-2 border-b pb-3">
                  <span className="block font-bold text-slate-705">Order Delivery & Commissioning Options</span>
                  <div className="space-y-2 mt-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={deliveryCompleted}
                        onChange={e => {
                          setDeliveryCompleted(e.target.checked);
                          if (!e.target.checked) {
                            setCommissioningDone(false);
                          }
                        }}
                        className="rounded border-slate-350 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>Delivery Completed</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={commissioningDone}
                        onChange={e => {
                          setCommissioningDone(e.target.checked);
                          if (e.target.checked) {
                            setDeliveryCompleted(true);
                          }
                        }}
                        className="rounded border-slate-355 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>Commissioning Done</span>
                    </label>

                    {commissioningDone && (
                      <div className="mt-2.5 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-1.5">
                        <span className="block font-semibold text-[11px] text-emerald-805">Upload Commissioning Report</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          onChange={e => {
                            const file = e.target.files?.[0] || null;
                            setCommissioningReportFile(file);
                          }}
                          className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border file:border-slate-300 file:bg-white file:text-slate-700 file:cursor-pointer hover:file:bg-slate-50"
                        />
                        {commissioningReportFile && (
                          <p className="text-[10px] text-emerald-700 font-medium">Selected: {commissioningReportFile.name}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {loggingVisitObj?.visitType === 'Commissioning' && (
                <div className="space-y-2 border-b pb-3">
                  <span className="block font-bold text-slate-700">Commissioning Completion Option</span>
                  <div className="space-y-2 mt-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={commissioningDone}
                        onChange={e => setCommissioningDone(e.target.checked)}
                        className="rounded border-slate-355 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>Commissioning Done</span>
                    </label>

                    {commissioningDone && (
                      <div className="mt-2.5 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-1.5">
                        <span className="block font-semibold text-[11px] text-emerald-805">Upload Commissioning Report</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          onChange={e => {
                            const file = e.target.files?.[0] || null;
                            setCommissioningReportFile(file);
                          }}
                          className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border file:border-slate-300 file:bg-white file:text-slate-700 file:cursor-pointer hover:file:bg-slate-50"
                        />
                        {commissioningReportFile && (
                          <p className="text-[10px] text-emerald-700 font-medium">Selected: {commissioningReportFile.name}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {loggingVisitObj?.visitType === 'Service' && (
                <div className="space-y-2 border-b pb-3">
                  <span className="block font-bold text-slate-700">Service Task Completion</span>
                  <div className="space-y-2 mt-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={serviceDone}
                        onChange={e => setServiceDone(e.target.checked)}
                        className="rounded border-slate-350 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>Service Done</span>
                    </label>

                    {serviceDone && (
                      <>
                        {loggingVisitObj.serviceType === 'Major' ? (
                          <div className="space-y-2 mt-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                            <div>
                              <label className="block font-semibold text-[11px] text-[#173c2d] font-bold">Pre-Service Report File Name</label>
                              <input
                                type="text"
                                value={servicePreReportName}
                                onChange={e => setServicePreReportName(e.target.value)}
                                placeholder="e.g. pre-service-report.pdf"
                                className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white focus:ring-emerald-500 mt-1"
                                required
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-[11px] text-[#173c2d] font-bold">Post-Service Report File Name</label>
                              <input
                                type="text"
                                value={servicePostReportName}
                                onChange={e => setServicePostReportName(e.target.value)}
                                placeholder="e.g. post-service-report.pdf"
                                className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white focus:ring-emerald-500 mt-1"
                                required
                              />
                            </div>
                            
                            <div className="pt-2 border-t mt-2">
                              <span className="block font-bold text-[11px] text-slate-700">Spare Parts Logged</span>
                              <div className="flex gap-1.5 mt-1">
                                <select
                                  value={serviceSelectedPartId}
                                  onChange={e => setServiceSelectedPartId(e.target.value)}
                                  className="flex-1 rounded border border-slate-300 p-1 text-[11px] bg-white"
                                >
                                  <option value="">Select Spare Part...</option>
                                  {inventory.map(item => (
                                    <option key={item.id} value={item.id}>{item.name} (Stock: {item.quantity})</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min="1"
                                  value={serviceSelectedPartQty}
                                  onChange={e => setServiceSelectedPartQty(e.target.value)}
                                  className="w-12 rounded border border-slate-300 p-1 text-[11px] text-center"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!serviceSelectedPartId) return;
                                    const qty = Number(serviceSelectedPartQty);
                                    const existingIdx = servicePartsUsed.findIndex(p => p.partId === serviceSelectedPartId);
                                    if (existingIdx >= 0) {
                                      const updated = [...servicePartsUsed];
                                      updated[existingIdx].qty += qty;
                                      setServicePartsUsed(updated);
                                    } else {
                                      setServicePartsUsed([...servicePartsUsed, { partId: serviceSelectedPartId, qty }]);
                                    }
                                    setServiceSelectedPartId("");
                                    setServiceSelectedPartQty("1");
                                  }}
                                  className="bg-[#173c2d] hover:bg-[#204a3b] text-white px-2 py-1 rounded text-xs font-bold"
                                >
                                  Add
                                </button>
                              </div>
                              
                              {servicePartsUsed.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {servicePartsUsed.map(part => {
                                    const invItem = inventory.find(i => i.id === part.partId);
                                    return (
                                      <div key={part.partId} className="flex justify-between items-center bg-white border border-slate-200 p-1.5 rounded text-[10px]">
                                        <span className="font-semibold text-slate-700">{invItem?.name || part.partId}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-900">Qty: {part.qty}</span>
                                          <button
                                            type="button"
                                            onClick={() => setServicePartsUsed(servicePartsUsed.filter(p => p.partId !== part.partId))}
                                            className="text-red-500 hover:text-red-700 font-bold"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 mt-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                            <label className="block font-semibold text-[11px] text-[#173c2d] font-bold">Checkup Report File Name</label>
                            <input
                              type="text"
                              value={serviceCheckupReportName}
                              onChange={e => setServiceCheckupReportName(e.target.value)}
                              placeholder="e.g. checkup-report.pdf"
                              className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white focus:ring-emerald-500"
                              required
                            />
                            
                            <label className="flex items-center gap-1.5 mt-2 cursor-pointer text-slate-750 font-semibold">
                              <input
                                type="checkbox"
                                checked={serviceIssueFound}
                                onChange={e => setServiceIssueFound(e.target.checked)}
                                className="rounded border-slate-350 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                              />
                              <span>Machinery Issue Found?</span>
                            </label>
                            
                            {serviceIssueFound && (
                              <div className="mt-1.5 space-y-1">
                                <label className="block font-semibold text-[10px] text-slate-500">Service Quotation File Name</label>
                                <input
                                  type="text"
                                  value={serviceQuotationName}
                                  onChange={e => setServiceQuotationName(e.target.value)}
                                  placeholder="e.g. service-quotation.pdf"
                                  className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white focus:ring-emerald-500"
                                  required
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {isSalesVisit ? (
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
              ) : (
                <div className="p-2 bg-slate-55 rounded-lg border border-slate-200 text-slate-600 font-semibold text-[11px]">
                  This visit outcome will be logged and marked as <span className="text-emerald-700 font-bold">Completed</span>.
                </div>
              )}

              {/* Conditional Follow Up Date for Postponed */}
              {isSalesVisit && logStatus === "Postponed" && (
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
              {(isSalesVisit ? logStatus !== "" : true) && (
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
                onClick={closeLogModal}
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

      {/* Delivery Warning Modal */}
      {showDeliveryWarning && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl animate-scaleUp p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">Warning: Order Status Notice</h3>
              <button
                onClick={() => {
                  setShowDeliveryWarning(false);
                  setPendingVisitPayload(null);
                }}
                className="text-slate-400 hover:text-slate-650"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Current status is <span className="font-bold text-slate-900">{deliveryWarningStatus}</span>, are you sure you want to schedule <span className="font-bold text-slate-900">Delivery</span> visit?
            </p>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeliveryWarning(false);
                  setPendingVisitPayload(null);
                }}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (pendingVisitPayload) {
                    executeSaveVisit(pendingVisitPayload);
                  }
                }}
                className="flex-1 bg-[#173c2d] hover:bg-[#204a3b] text-xs font-bold text-white"
              >
                Confirm Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
