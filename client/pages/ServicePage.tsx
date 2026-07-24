import React, { useState, useMemo, useRef } from "react";
import { Search, Wrench, Calendar, Clock, Check, X, AlertTriangle, Plus, FileText, Activity, ArrowLeft, Upload } from "lucide-react";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { useAppState, ServiceCycle, Part } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";

export const ServicePage: React.FC = () => {
  const {
    serviceCycles, completeServiceCheckup, completeMajorService,
    uploadServiceQuotation, inventory, currentUserRole, currentSimulatedUser, employees, orders,
    hasWritePermission, assignServiceTrackEngineer
  } = useAppState();

  const canWrite = hasWritePermission("Service");

  const [search, setSearch] = useState("");
  const [nearDueFilter, setNearDueFilter] = useState(false);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);

  // Active cycles selection
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  // Dialog open state
  const [isCheckupOpen, setIsCheckupOpen] = useState(false);
  const [isMajorOpen, setIsMajorOpen] = useState(false);

  // 45-Day Checkup Form State
  const [checkupReportName, setCheckupReportName] = useState("");
  const [issueFound, setIssueFound] = useState(false);
  const [serviceQuoteName, setServiceQuoteName] = useState("");
  const [checkupEngineer, setCheckupEngineer] = useState("");

  // 2000-Hour Major Service Form State
  const [preReportName, setPreReportName] = useState("");
  const [postReportName, setPostReportName] = useState("");
  const [partsUsedList, setPartsUsedList] = useState<{ partId: string; qty: number }[]>([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [selectedPartQty, setSelectedPartQty] = useState("1");
  const [majorEngineer, setMajorEngineer] = useState("");

  // File Input Refs
  const checkupFileRef = useRef<HTMLInputElement>(null);
  const quoteFileRef = useRef<HTMLInputElement>(null);
  const preFileRef = useRef<HTMLInputElement>(null);
  const postFileRef = useRef<HTMLInputElement>(null);

  const activeCycle = useMemo(() => {
    return serviceCycles.find(sc => sc.orderId === selectedCycleId) || null;
  }, [serviceCycles, selectedCycleId]);

  const activeOrder = useMemo(() => {
    return orders.find(o => o.id === selectedCycleId) || null;
  }, [orders, selectedCycleId]);

  // Combine reports & quotations into a timeline format
  const timelineItems = useMemo(() => {
    if (!activeCycle) return [];
    const items: {
      id: string;
      type: "Checkup" | "Major Service";
      date: string;
      engineer: string;
      reports: { type: string; name: string }[];
      quotation?: string;
    }[] = [];

    // Group checkup reports
    activeCycle.checkupReports.forEach(r => {
      const quote = activeCycle.serviceQuotations.find(q => 
        Math.abs(new Date(q.uploadedAt).getTime() - new Date(r.uploadedAt).getTime()) < 120000
      );
      items.push({
        id: r.id,
        type: "Checkup",
        date: r.uploadedAt,
        engineer: r.serviceEngineer || "Unassigned",
        reports: [{ type: "Checkup Report", name: r.fileName }],
        quotation: quote?.fileName
      });
    });

    // Pair pre and post service reports for Major Services
    const preReports = [...activeCycle.preServiceReports];
    const postReports = [...activeCycle.postServiceReports];

    preReports.forEach(pre => {
      const postIdx = postReports.findIndex(post => 
        Math.abs(new Date(post.uploadedAt).getTime() - new Date(pre.uploadedAt).getTime()) < 120000
      );
      let postRep = null;
      if (postIdx > -1) {
        postRep = postReports[postIdx];
        postReports.splice(postIdx, 1);
      }

      const reports = [{ type: "Pre-Service Report", name: pre.fileName }];
      if (postRep) {
        reports.push({ type: "Post-Service Report", name: postRep.fileName });
      }

      items.push({
        id: pre.id,
        type: "Major Service",
        date: pre.uploadedAt,
        engineer: pre.serviceEngineer || "Unassigned",
        reports
      });
    });

    postReports.forEach(post => {
      items.push({
        id: post.id,
        type: "Major Service",
        date: post.uploadedAt,
        engineer: post.serviceEngineer || "Unassigned",
        reports: [{ type: "Post-Service Report", name: post.fileName }]
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeCycle]);

  // Calculate days remaining for a target date
  const getDaysRemaining = (targetDateStr?: string) => {
    if (!targetDateStr) return null;
    const diffTime = new Date(targetDateStr).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Near due filter logic: either countdown <= 7 days
  const enrichedCycles = useMemo(() => {
    return serviceCycles.map(sc => {
      const checkupDays = getDaysRemaining(sc.nextCheckupDate);
      const majorDays = sc.nextMajorServiceDate ? getDaysRemaining(sc.nextMajorServiceDate) : null;
      
      const isCheckupNearDue = checkupDays !== null && checkupDays <= 7;
      const isMajorNearDue = majorDays !== null && majorDays <= 7;
      const isNearDue = isCheckupNearDue || isMajorNearDue;

      return {
        ...sc,
        checkupDays,
        majorDays,
        isNearDue
      };
    });
  }, [serviceCycles]);

  const filteredCycles = useMemo(() => {
    return enrichedCycles.filter(sc => {
      const matchSearch = `${sc.orderId} ${sc.companyName}`.toLowerCase().includes(search.toLowerCase());
      const matchNearDue = !nearDueFilter || sc.isNearDue;
      return matchSearch && matchNearDue;
    });
  }, [enrichedCycles, search, nearDueFilter]);

  const serviceEngineersList = useMemo(() => {
    return employees.filter(emp => emp.role === "Service Engineer");
  }, [employees]);

  // Near due alerts with nearest service engineer recommendations based on city match
  const nearDueAlerts = useMemo(() => {
    return enrichedCycles
      .filter(sc => sc.isNearDue)
      .map(sc => {
        const orderObj = orders.find(o => o.id === sc.orderId);
        const orderCity = orderObj?.city || "";
        const nearest = serviceEngineersList.filter(
          emp => emp.city && orderCity && emp.city.toLowerCase() === orderCity.toLowerCase()
        );
        return {
          ...sc,
          orderCity,
          nearestEngineers: nearest
        };
      });
  }, [enrichedCycles, orders, serviceEngineersList]);

  const handleAddPartToUsage = () => {
    if (!selectedPartId) return;
    const existingIndex = partsUsedList.findIndex(p => p.partId === selectedPartId);
    const qty = Number(selectedPartQty);

    if (existingIndex >= 0) {
      const updated = [...partsUsedList];
      updated[existingIndex].qty += qty;
      setPartsUsedList(updated);
    } else {
      setPartsUsedList([...partsUsedList, { partId: selectedPartId, qty }]);
    }

    setSelectedPartId("");
    setSelectedPartQty("1");
  };

  const handleRemovePartFromUsage = (partId: string) => {
    setPartsUsedList(partsUsedList.filter(p => p.partId !== partId));
  };

  const handleCheckupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleId || !checkupEngineer) return;

    if (currentUserRole !== "Owner" && !checkupReportName.trim()) {
      alert("Please select a checkup report file.");
      return;
    }

    const finalReport = checkupReportName.trim() || "Owner Override - No Report";
    completeServiceCheckup(selectedCycleId, finalReport, checkupEngineer);

    // If issues found, upload service quotation
    if (issueFound) {
      const finalQuote = serviceQuoteName.trim() || (currentUserRole === "Owner" ? "Owner Override - No Quotation" : "");
      if (finalQuote) {
        uploadServiceQuotation(selectedCycleId, finalQuote);
      }
    }

    // Reset forms
    setIsCheckupOpen(false);
    setCheckupReportName("");
    setIssueFound(false);
    setServiceQuoteName("");
    setCheckupEngineer("");
  };

  const handleMajorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleId || !majorEngineer) return;

    if (currentUserRole !== "Owner" && (!preReportName.trim() || !postReportName.trim())) {
      alert("Please upload both pre-service and post-service reports.");
      return;
    }

    const finalPre = preReportName.trim() || "Owner Override - No Pre Report";
    const finalPost = postReportName.trim() || "Owner Override - No Post Report";

    completeMajorService(
      selectedCycleId,
      finalPre,
      finalPost,
      partsUsedList,
      majorEngineer
    );

    // Reset forms
    setIsMajorOpen(false);
    setPreReportName("");
    setPostReportName("");
    setPartsUsedList([]);
    setMajorEngineer("");
  };

  // Active cycle enriched logic for detail alert
  const activeCycleEnriched = useMemo(() => {
    if (!selectedCycleId) return null;
    return enrichedCycles.find(c => c.orderId === selectedCycleId) || null;
  }, [enrichedCycles, selectedCycleId]);

  const nearestEngineersForActive = useMemo(() => {
    if (!activeOrder?.city) return [];
    return serviceEngineersList.filter(
      emp => emp.city && activeOrder.city && emp.city.toLowerCase() === activeOrder.city.toLowerCase()
    );
  }, [activeOrder, serviceEngineersList]);

  // Details View layout
  if (selectedCycleId && activeCycle) {
    return (
      <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8 space-y-6">
        {/* Detail Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCycleId(null)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition animate-fadeIn"
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-[#15251f]">{activeCycle.companyName}</h1>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border bg-emerald-100 text-emerald-800 border-emerald-200">
                  Commissioned
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Order ID: <strong>{activeCycle.orderId}</strong> · Day 0: <strong>{new Date(activeCycle.commissionedDate).toLocaleDateString()}</strong>
              </p>
            </div>
          </div>

          {canWrite && (
            <div className="flex gap-2">
              {(currentUserRole === "Owner" || currentUserRole === "Receptionist" || activeCycle.assignedCheckupEngineer === currentSimulatedUser) && (
                <button
                  onClick={() => {
                    setCheckupEngineer(activeCycle.assignedCheckupEngineer || currentSimulatedUser);
                    setIsCheckupOpen(true);
                  }}
                  className="bg-[#173c2d]/10 hover:bg-[#173c2d]/25 text-[#173c2d] px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check size={14} />
                  <span>Log Checkup Visit</span>
                </button>
              )}
              {(currentUserRole === "Owner" || currentUserRole === "Receptionist" || activeCycle.assignedMajorEngineer === currentSimulatedUser) && (
                <button
                  onClick={() => {
                    setMajorEngineer(activeCycle.assignedMajorEngineer || currentSimulatedUser);
                    setIsMajorOpen(true);
                  }}
                  className="bg-[#173c2d] hover:bg-[#204a3b] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Wrench size={14} />
                  <span>Log Major Service</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Detailed warning alert for near due service */}
        {activeCycleEnriched && activeCycleEnriched.isNearDue && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-fadeIn">
            <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={18} />
            <div className="flex-1">
              <h4 className="font-bold text-amber-800 text-sm">Action Required: Service Due Soon</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                This commissioned machine has an upcoming service track due:
                {activeCycleEnriched.checkupDays !== null && activeCycleEnriched.checkupDays <= 7 && ` Checkup is due in ${activeCycleEnriched.checkupDays <= 0 ? "0 (Overdue)" : activeCycleEnriched.checkupDays} days.`}
                {activeCycleEnriched.majorDays !== null && activeCycleEnriched.majorDays <= 7 && ` Major Service is due in ${activeCycleEnriched.majorDays <= 0 ? "0 (Due Now)" : activeCycleEnriched.majorDays} days.`}
                Please log a service completion and ensure a service engineer is assigned for this order.
              </p>
              <div className="mt-2 text-xs text-amber-900 bg-white/60 p-2.5 rounded-lg border border-amber-100">
                <span className="font-semibold">Nearest Service Engineer(s) in {activeOrder?.city || "Location"}:</span>
                {nearestEngineersForActive.length > 0 ? (
                  <span className="ml-1 text-emerald-800 font-bold">
                    {nearestEngineersForActive.map(e => `${e.name} (${e.city})`).join(", ")}
                  </span>
                ) : (
                  <span className="ml-1 text-slate-500 italic">No engineer based in this city. Available service engineers: {serviceEngineersList.map(e => `${e.name} (${e.city || "No Base"})`).join(", ")}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Basic Order Info Card & Service Countdown Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <FileText size={17} className="text-[#173c2d]" />
              Order Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Salesperson</span>
                <p className="font-medium text-slate-800 mt-0.5">{activeOrder?.salesperson || "N/A"}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">City / Location</span>
                <p className="font-medium text-slate-800 mt-0.5">{activeOrder?.city || "N/A"}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Assigned Engineer</span>
                <p className="font-medium text-slate-800 mt-0.5">{activeOrder?.assignedEngineer || "None"}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Order Value</span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {activeOrder?.orderValue ? `₹${activeOrder.orderValue.toLocaleString()}` : "N/A"}
                </p>
              </div>
            </div>
            {activeOrder?.productsSelected && activeOrder.productsSelected.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-xs text-slate-400 font-semibold uppercase">Purchased Machinery</span>
                <div className="space-y-1 mt-1">
                  {activeOrder.productsSelected.map((prod, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 border p-2 rounded-lg">
                      <span className="font-medium text-slate-700">{prod.productName}</span>
                      <span className="text-slate-500">Qty: {prod.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Activity size={17} className="text-[#173c2d]" />
              Active Maintenance Tracks
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-3.5 rounded-xl border gap-3">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm">45-Day Checkup</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Next: {activeCycle.nextCheckupDate}</p>
                  <p className="text-xs text-slate-650 mt-1.5">
                    Assigned: <strong className="text-slate-805">{activeCycle.assignedCheckupEngineer || "None"}</strong>
                  </p>
                  {(currentUserRole === "Owner" || currentUserRole === "Receptionist") && (
                    <div className="mt-2">
                      <select
                        value={activeCycle.assignedCheckupEngineer || ""}
                        onChange={(e) => assignServiceTrackEngineer(activeCycle.orderId, "Checkup", e.target.value || null)}
                        className="rounded-lg border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#5b8d65]"
                      >
                        <option value="">-- Assign Checkup Eng --</option>
                        {serviceEngineersList.map(eng => (
                          <option key={eng.name} value={eng.name}>{eng.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto ${
                  getDaysRemaining(activeCycle.nextCheckupDate) !== null && getDaysRemaining(activeCycle.nextCheckupDate)! <= 0
                    ? "bg-red-100 text-red-800 border-red-200"
                    : getDaysRemaining(activeCycle.nextCheckupDate) !== null && getDaysRemaining(activeCycle.nextCheckupDate)! <= 7
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  {getDaysRemaining(activeCycle.nextCheckupDate) === null
                    ? "N/A"
                    : getDaysRemaining(activeCycle.nextCheckupDate)! <= 0
                    ? "Overdue"
                    : `${getDaysRemaining(activeCycle.nextCheckupDate)} days left`}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-3.5 rounded-xl border gap-3">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm">2000-Hr Major Service (80-day cycle)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Current Meter: <strong>{activeCycle.currentHourMeter} hrs</strong></p>
                  <p className="text-xs text-slate-650 mt-1.5">
                    Assigned: <strong className="text-slate-805">{activeCycle.assignedMajorEngineer || "None"}</strong>
                  </p>
                  {(currentUserRole === "Owner" || currentUserRole === "Receptionist") && (
                    <div className="mt-2">
                      <select
                        value={activeCycle.assignedMajorEngineer || ""}
                        onChange={(e) => assignServiceTrackEngineer(activeCycle.orderId, "Major", e.target.value || null)}
                        className="rounded-lg border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#5b8d65]"
                      >
                        <option value="">-- Assign Major Eng --</option>
                        {serviceEngineersList.map(eng => (
                          <option key={eng.name} value={eng.name}>{eng.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto ${
                  activeCycle.nextMajorServiceDate && getDaysRemaining(activeCycle.nextMajorServiceDate) !== null && getDaysRemaining(activeCycle.nextMajorServiceDate)! <= 0
                    ? "bg-red-100 text-red-800 border-red-200"
                    : activeCycle.nextMajorServiceDate && getDaysRemaining(activeCycle.nextMajorServiceDate) !== null && getDaysRemaining(activeCycle.nextMajorServiceDate)! <= 7
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  {activeCycle.nextMajorServiceDate && getDaysRemaining(activeCycle.nextMajorServiceDate) !== null
                    ? activeCycle.nextMajorServiceDate && getDaysRemaining(activeCycle.nextMajorServiceDate)! <= 0
                      ? "Due Now"
                      : `${getDaysRemaining(activeCycle.nextMajorServiceDate)} days est. left`
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline of Logs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-display font-bold text-slate-900 border-b pb-3 flex items-center gap-2 mb-6">
            <Clock size={17} className="text-[#173c2d]" />
            Service History & logs Timeline
          </h3>

          <div className="relative pl-6 border-l border-slate-200 space-y-6 ml-3">
            {timelineItems.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No services logged for this machine yet.</p>
            ) : (
              timelineItems.map((item) => (
                <div key={item.id} className="relative animate-fadeIn">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[30.5px] top-1.5 h-4.5 w-4.5 rounded-full border-4 bg-white ${
                    item.type === "Checkup" ? "border-emerald-600" : "border-indigo-600"
                  }`} />
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          item.type === "Checkup" ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                        }`}>
                          {item.type}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm">Service Logged</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(item.date).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Service Engineer: <strong>{item.engineer}</strong>
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                      {item.reports.map((rep, idx) => (
                        <div key={idx} className="inline-flex items-center gap-1.5 bg-white border rounded-lg px-2.5 py-1 text-xs text-slate-700">
                          <FileText size={13} className="text-[#173c2d]" />
                          <span>{rep.type}: <strong 
                            className="text-slate-900 cursor-pointer hover:text-[#173c2d] hover:underline transition-colors"
                            onClick={() => setPreviewFileName(rep.name)}
                          >{rep.name}</strong></span>
                        </div>
                      ))}

                      {item.quotation && (
                        <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 text-xs text-amber-800">
                          <FileText size={13} className="text-amber-600" />
                          <span>Quotation: <strong 
                            className="text-amber-900 cursor-pointer hover:text-amber-700 hover:underline transition-colors"
                            onClick={() => setPreviewFileName(item.quotation!)}
                          >{item.quotation}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 45-DAY CHECKUP VISIT DIALOG */}
        {isCheckupOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
              <div className="border-b p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">Log Checkup Visit</h3>
                  <p className="text-xs text-slate-500">{activeCycle.companyName}</p>
                </div>
                <button onClick={() => setIsCheckupOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
              </div>

              <form onSubmit={handleCheckupSubmit}>
                <div className="p-5 space-y-4">
                  {/* Service Engineer Dropdown (Only for Owner & Receptionist) */}
                  {(currentUserRole === "Owner" || currentUserRole === "Receptionist") ? (
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                      Assign Service Engineer <span className="text-rose-500">*</span>
                      <select
                        value={checkupEngineer}
                        onChange={e => setCheckupEngineer(e.target.value)}
                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                        required
                      >
                        <option value="">-- Select Engineer --</option>
                        {serviceEngineersList.map(eng => (
                          <option key={eng.name} value={eng.name}>{eng.name}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div className="text-xs font-semibold text-slate-700 bg-slate-50 border p-3 rounded-lg">
                      <span>Service Engineer:</span>
                      <p className="font-bold text-slate-900 mt-1">{checkupEngineer}</p>
                    </div>
                  )}

                  {/* File Upload Selector */}
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Checkup Report File {currentUserRole !== "Owner" && <span className="text-rose-500">*</span>}
                    <input
                      type="file"
                      ref={checkupFileRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCheckupReportName(file.name);
                        }
                      }}
                      required={currentUserRole !== "Owner" && !checkupReportName}
                    />
                    <div className="flex gap-2 items-center">
                      <Button
                        type="button"
                        onClick={() => checkupFileRef.current?.click()}
                        className="bg-[#173c2d]/10 hover:bg-[#173c2d]/25 text-[#173c2d] text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5"
                      >
                        <Upload size={14} />
                        <span>Choose Report</span>
                      </Button>
                      <span className="text-xs text-slate-500 truncate max-w-[240px]">
                        {checkupReportName || "No file selected (Optional for Owner)"}
                      </span>
                    </div>
                  </label>

                  <div className="space-y-3 pt-2.5 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={issueFound}
                        onChange={e => setIssueFound(e.target.checked)}
                        className="rounded border-slate-350 text-[#173c2d] focus:ring-[#173c2d]"
                      />
                      <span>Machinery Issue Found? Upload Service Quotation.</span>
                    </label>

                    {issueFound && (
                      <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5 animate-fadeIn">
                        Service Quotation File {currentUserRole !== "Owner" && <span className="text-rose-500">*</span>}
                        <input
                          type="file"
                          ref={quoteFileRef}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setServiceQuoteName(file.name);
                            }
                          }}
                          required={issueFound && currentUserRole !== "Owner" && !serviceQuoteName}
                        />
                        <div className="flex gap-2 items-center">
                          <Button
                            type="button"
                            onClick={() => quoteFileRef.current?.click()}
                            className="bg-[#173c2d]/10 hover:bg-[#173c2d]/25 text-[#173c2d] text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5"
                          >
                            <Upload size={14} />
                            <span>Choose Quotation</span>
                          </Button>
                          <span className="text-xs text-slate-500 truncate max-w-[240px]">
                            {serviceQuoteName || "No file selected (Optional for Owner)"}
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                  <Button type="button" onClick={() => setIsCheckupOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4">
                    Log Visit Complete
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2000-HOUR MAJOR SERVICE VISIT DIALOG */}
        {isMajorOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
              <div className="border-b p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">Log Major Service Visit</h3>
                  <p className="text-xs text-slate-500">{activeCycle.companyName} · Current: {activeCycle.currentHourMeter} hrs</p>
                </div>
                <button onClick={() => setIsMajorOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
              </div>

              <form onSubmit={handleMajorSubmit}>
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Service Engineer Dropdown (Only for Owner & Receptionist) */}
                  {(currentUserRole === "Owner" || currentUserRole === "Receptionist") ? (
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                      Assign Service Engineer <span className="text-rose-500">*</span>
                      <select
                        value={majorEngineer}
                        onChange={e => setMajorEngineer(e.target.value)}
                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                        required
                      >
                        <option value="">-- Select Engineer --</option>
                        {serviceEngineersList.map(eng => (
                          <option key={eng.name} value={eng.name}>{eng.name}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div className="text-xs font-semibold text-slate-700 bg-slate-50 border p-3 rounded-lg">
                      <span>Service Engineer:</span>
                      <p className="font-bold text-slate-900 mt-1">{majorEngineer}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                      Pre-Service Report File {currentUserRole !== "Owner" && <span className="text-rose-500">*</span>}
                      <input
                        type="file"
                        ref={preFileRef}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPreReportName(file.name);
                          }
                        }}
                        required={currentUserRole !== "Owner" && !preReportName}
                      />
                      <div className="flex gap-2 items-center">
                        <Button
                          type="button"
                          onClick={() => preFileRef.current?.click()}
                          className="bg-[#173c2d]/10 hover:bg-[#173c2d]/25 text-[#173c2d] text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5"
                        >
                          <Upload size={13} />
                          <span>Pre-Service File</span>
                        </Button>
                        <span className="text-xs text-slate-500 truncate max-w-[120px]">
                          {preReportName || "Optional for Owner"}
                        </span>
                      </div>
                    </label>

                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                      Post-Service Report File {currentUserRole !== "Owner" && <span className="text-rose-500">*</span>}
                      <input
                        type="file"
                        ref={postFileRef}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPostReportName(file.name);
                          }
                        }}
                        required={currentUserRole !== "Owner" && !postReportName}
                      />
                      <div className="flex gap-2 items-center">
                        <Button
                          type="button"
                          onClick={() => postFileRef.current?.click()}
                          className="bg-[#173c2d]/10 hover:bg-[#173c2d]/25 text-[#173c2d] text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5"
                        >
                          <Upload size={13} />
                          <span>Post-Service File</span>
                        </Button>
                        <span className="text-xs text-slate-500 truncate max-w-[120px]">
                          {postReportName || "Optional for Owner"}
                        </span>
                      </div>
                    </label>
                  </div>



                  {/* Parts usage log */}
                  <div className="space-y-2 border-t pt-3">
                    <h4 className="text-xs font-bold text-slate-700">Spare Parts Log (Auto-decrements Inventory)</h4>
                    
                    <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-lg border">
                      <label className="text-xs text-slate-600 flex flex-col gap-1 flex-1">
                        Pick Part
                        <select
                          value={selectedPartId}
                          onChange={e => setSelectedPartId(e.target.value)}
                          className="rounded border bg-white px-2.5 py-1.5 text-xs outline-none"
                        >
                          <option value="">-- Choose Spare --</option>
                          {inventory.map(part => (
                            <option key={part.id} value={part.id}>{part.name} (Stock: {part.quantity})</option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs text-slate-600 flex flex-col gap-1 w-20">
                        Quantity
                        <input
                          type="number"
                          min="1"
                          value={selectedPartQty}
                          onChange={e => setSelectedPartQty(e.target.value)}
                          className="rounded border px-2.5 py-1.5 text-xs outline-none"
                        />
                      </label>
                      <Button
                        type="button"
                        onClick={handleAddPartToUsage}
                        className="bg-[#173c2d] hover:bg-[#204a3b] text-white px-3 py-1.5 text-xs"
                      >
                        Add
                      </Button>
                    </div>

                    {/* List of picked parts */}
                    <div className="space-y-1">
                      {partsUsedList.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No parts logged for this service yet.</p>
                      ) : (
                        partsUsedList.map(item => {
                          const partObj = inventory.find(i => i.id === item.partId);
                          return (
                            <div key={item.partId} className="flex justify-between items-center bg-white border rounded p-2 text-xs">
                              <div>
                                <strong>{partObj?.name || item.partId}</strong>
                                <span className="text-[10px] text-slate-400 ml-2">Qty: {item.qty}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePartFromUsage(item.partId)}
                                className="text-red-500 hover:underline text-[10px]"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                  <Button type="button" onClick={() => setIsMajorOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4">
                    Log Major Service Complete
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
  }

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8 space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-xs font-semibold text-[#58705c] uppercase tracking-wider">Maintenance Tracks</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#15251f] mt-1">Service Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track independent service countdowns (45-day checkup and 2000-hr major service) starting from installation Day 0. Click any row to view full details and history.
          </p>
        </div>
      </div>

      {/* Near due service alerts banner */}
      {nearDueAlerts.length > 0 && (
        <div className="space-y-3">
          {nearDueAlerts.map(alert => (
            <div key={alert.orderId} className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-fadeIn">
              <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={18} />
              <div className="flex-1">
                <h4 className="font-bold text-amber-800 text-sm">Service Track Near Due / Overdue</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  <strong>{alert.companyName}</strong> (Order ID: {alert.orderId}) has an upcoming service task due soon: 
                  {alert.checkupDays !== null && alert.checkupDays <= 7 && ` 45-Day Checkup next due: ${alert.nextCheckupDate} (${alert.checkupDays <= 0 ? "Overdue" : `${alert.checkupDays} days remaining`}).`}
                  {alert.majorDays !== null && alert.majorDays <= 7 && ` 2000-Hr Major Service estimated next due: ${alert.nextMajorServiceDate} (${alert.majorDays <= 0 ? "Due Now" : `${alert.majorDays} days remaining`}).`}
                </p>
                <div className="mt-2 text-xs text-amber-900 bg-white/60 p-2.5 rounded-lg border border-amber-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <span className="font-semibold">Nearest Service Engineer(s) in {alert.orderCity || "Location"}:</span>
                    {alert.nearestEngineers.length > 0 ? (
                      <span className="ml-1 text-emerald-800 font-bold">
                        {alert.nearestEngineers.map(e => `${e.name} (${e.city})`).join(", ")}
                      </span>
                    ) : (
                      <span className="ml-1 text-slate-500 italic">No engineer in this city. Available service engineers: {serviceEngineersList.map(e => `${e.name} (${e.city || "No Base"})`).join(", ")}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCycleId(alert.orderId)}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#173c2d] hover:underline self-end sm:self-auto"
                  >
                    Go to Details & Assign
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company or order..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#5b8d65]"
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer self-start sm:self-auto">
          <input
            type="checkbox"
            checked={nearDueFilter}
            onChange={e => setNearDueFilter(e.target.checked)}
            className="rounded border-slate-350 text-[#173c2d] focus:ring-[#173c2d]"
          />
          <span className="text-amber-800 flex items-center gap-1">
            <AlertTriangle size={15} />
            Show Near Due / Overdue Only (≤ 7 Days)
          </span>
        </label>
      </div>

      {/* Listing */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Company Details</th>
                <th className="px-5 py-3.5">Commissioned Date (Day 0)</th>
                <th className="px-5 py-3.5">45-Day Checkup Track</th>
                <th className="px-5 py-3.5">2000-Hr Major Service Track</th>
                <th className="px-5 py-3.5 text-center">Service Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCycles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No commissioned machine tracks found.</td>
                </tr>
              ) : (
                filteredCycles.map(sc => {
                  return (
                    <tr
                      key={sc.orderId}
                      className="hover:bg-slate-50/50 cursor-pointer transition"
                      onClick={() => setSelectedCycleId(sc.orderId)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{sc.companyName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Order ID: {sc.orderId}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          {new Date(sc.commissionedDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-500">Next checkup: {sc.nextCheckupDate}</span>
                          <span className={`font-semibold ${
                            sc.checkupDays === null
                              ? "text-slate-400"
                              : sc.checkupDays <= 0
                              ? "text-red-700 font-bold"
                              : sc.checkupDays <= 7
                              ? "text-amber-700"
                              : "text-slate-600"
                          }`}>
                            {sc.checkupDays === null
                              ? "N/A"
                              : sc.checkupDays <= 0
                              ? `OVERDUE by ${Math.abs(sc.checkupDays)} days`
                              : `${sc.checkupDays} days remaining`}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Completed: {sc.checkupReports.length} checkups
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-500">Current Hour-Meter: <strong>{sc.currentHourMeter} hrs</strong></span>
                          <span className={`font-semibold ${
                            sc.majorDays === null
                              ? "text-slate-400"
                              : sc.majorDays <= 0
                              ? "text-red-700 font-bold"
                              : sc.majorDays <= 7
                              ? "text-amber-700"
                              : "text-slate-600"
                          }`}>
                            {sc.majorDays === null
                              ? "N/A"
                              : sc.majorDays <= 0
                              ? "OVERDUE (2000h Due)"
                              : `${sc.majorDays} days estimated left`}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Pre: {sc.preServiceReports.length} · Post: {sc.postServiceReports.length}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedCycleId(sc.orderId); setIsCheckupOpen(true); }}
                            className="bg-[#173c2d]/10 hover:bg-[#173c2d]/25 text-[#173c2d] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Check size={12} />
                            <span>Checkup Visit</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedCycleId(sc.orderId); setIsMajorOpen(true); }}
                            className="bg-[#173c2d] hover:bg-[#204a3b] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Wrench size={12} />
                            <span>Major Service</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {filteredCycles.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 italic">No commissioned machine tracks found.</div>
          ) : (
            filteredCycles.map(sc => (
              <div
                key={sc.orderId}
                className="p-4 space-y-3 hover:bg-slate-50/50 cursor-pointer transition"
                onClick={() => setSelectedCycleId(sc.orderId)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">{sc.companyName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Order ID: {sc.orderId}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border px-2 py-0.5 rounded-md">
                    Day 0: {new Date(sc.commissionedDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 border p-3 rounded-xl bg-slate-50/50 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">45-Day Checkup</span>
                    <p className={`font-semibold mt-1 ${
                      sc.checkupDays !== null && sc.checkupDays <= 0 ? "text-red-600" : sc.checkupDays !== null && sc.checkupDays <= 7 ? "text-amber-700" : "text-slate-700"
                    }`}>
                      {sc.checkupDays !== null && sc.checkupDays <= 0 ? "OVERDUE" : `${sc.checkupDays} days left`}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Next: {sc.nextCheckupDate}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">2000h Major Service</span>
                    <p className={`font-semibold mt-1 ${
                      sc.majorDays !== null && sc.majorDays <= 0 ? "text-red-600" : sc.majorDays !== null && sc.majorDays <= 7 ? "text-amber-700" : "text-slate-700"
                    }`}>
                      {sc.majorDays !== null && sc.majorDays <= 0 ? "OVERDUE" : `${sc.majorDays} days est.`}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Hours: {sc.currentHourMeter} hrs</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedCycleId(sc.orderId); setIsCheckupOpen(true); }}
                    className="flex-1 bg-[#173c2d]/10 text-[#173c2d] py-2 rounded-lg text-xs font-bold hover:bg-[#173c2d]/20 transition"
                  >
                    Checkup Visit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedCycleId(sc.orderId); setIsMajorOpen(true); }}
                    className="flex-1 bg-[#173c2d] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#204a3b] transition"
                  >
                    Major Service
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal 
        isOpen={!!previewFileName} 
        fileName={previewFileName} 
        onClose={() => setPreviewFileName(null)} 
      />
    </section>
  );
};
