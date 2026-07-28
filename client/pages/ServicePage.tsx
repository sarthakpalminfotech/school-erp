import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Wrench, Calendar, Clock, Check, X, AlertTriangle, Plus, FileText, Activity, ArrowLeft, Upload } from "lucide-react";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { useAppState, ServiceCycle, Part } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";

export const ServicePage: React.FC = () => {
  const {
    serviceCycles, completeServiceCheckup, completeMajorService,
    uploadServiceQuotation, inventory, currentUserRole, currentSimulatedUser, employees, orders,
    hasWritePermission, assignServiceTrackEngineer, customers, complaints, visits, addVisit
  } = useAppState();

  const canWrite = hasWritePermission("Service");
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || "";

  const [search, setSearch] = useState("");
  const [nearDueFilter, setNearDueFilter] = useState(false);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);

  // Active cycles selection
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(initialOrderId || null);
  const [activeServiceTab, setActiveServiceTab] = useState<"docs" | "history">("history");

  useEffect(() => {
    const qOrderId = searchParams.get("orderId");
    if (qOrderId) {
      setSelectedCycleId(qOrderId);
    }
  }, [searchParams]);

  // Dialog open state
  const [isCheckupOpen, setIsCheckupOpen] = useState(false);
  const [isMajorOpen, setIsMajorOpen] = useState(false);

  // Assign Service Visit Modal State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignServiceType, setAssignServiceType] = useState<'Checkup' | 'Major'>('Checkup');
  const [assignEngineer, setAssignEngineer] = useState('');
  const [assignDateTime, setAssignDateTime] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

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
      if (currentUserRole === "Service Engineer") {
        const isAssigned = sc.assignedCheckupEngineer === currentSimulatedUser || sc.assignedMajorEngineer === currentSimulatedUser;
        if (!isAssigned) return false;
      }
      const matchSearch = `${sc.orderId} ${sc.companyName}`.toLowerCase().includes(search.toLowerCase());
      const matchNearDue = !nearDueFilter || sc.isNearDue;
      return matchSearch && matchNearDue;
    });
  }, [enrichedCycles, search, nearDueFilter, currentUserRole, currentSimulatedUser]);

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

  const customerObj = useMemo(() => {
    if (!activeCycle) return null;
    return customers.find(c => c.name.toLowerCase() === activeCycle.companyName.toLowerCase()) || null;
  }, [customers, activeCycle]);

  const customerName = customerObj?.contactPerson || activeOrder?.companyName || "N/A";
  const phone = customerObj?.phone || "N/A";

  const nextDueServiceInfo = useMemo(() => {
    if (!activeCycle) return null;
    const checkupDate = activeCycle.nextCheckupDate;
    const majorDate = activeCycle.nextMajorServiceDate;

    const checkupDays = getDaysRemaining(checkupDate);
    const majorDays = majorDate ? getDaysRemaining(majorDate) : null;

    let type = "Checkup";
    let date = checkupDate;
    let days = checkupDays;
    let engineer = activeCycle.assignedCheckupEngineer || "None";

    if (majorDate && checkupDays !== null && majorDays !== null) {
      if (majorDays < checkupDays) {
        type = "Main Service";
        date = majorDate;
        days = majorDays;
        engineer = activeCycle.assignedMajorEngineer || "None";
      }
    }

    return {
      type,
      date,
      days,
      engineer
    };
  }, [activeCycle]);

  const pendingServiceVisits = useMemo(() => {
    if (!activeCycle) return [];
    return visits.filter(v =>
      v.orderId === activeCycle.orderId &&
      v.visitType === 'Service' &&
      v.status !== 'Completed'
    );
  }, [visits, activeCycle]);

  const checkupDays = activeCycle ? getDaysRemaining(activeCycle.nextCheckupDate) : null;
  const majorDays = activeCycle && activeCycle.nextMajorServiceDate ? getDaysRemaining(activeCycle.nextMajorServiceDate) : null;

  // Details View layout
  if (selectedCycleId && activeCycle) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 px-4 py-5 space-y-5 animate-fadeIn">

        {/* Near-due warning banner */}
        {activeCycleEnriched?.isNearDue && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2">
            <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={15} />
            <p className="text-xs text-amber-800">
              <strong>Action Required:</strong> Service is due soon.
              {activeCycleEnriched.checkupDays !== null && activeCycleEnriched.checkupDays <= 7 && ` Checkup due in ${activeCycleEnriched.checkupDays <= 0 ? "0 (Overdue)" : activeCycleEnriched.checkupDays} days.`}
              {activeCycleEnriched.majorDays !== null && activeCycleEnriched.majorDays <= 7 && ` Major Service due in ${activeCycleEnriched.majorDays <= 0 ? "0 (Due Now)" : activeCycleEnriched.majorDays} days.`}
            </p>
          </div>
        )}

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedCycleId(null);
              setSearchParams({});
            }}
            className="text-[#173c2d] font-semibold text-sm flex items-center gap-1.5"
          >
            <ArrowLeft size={15} /> Back to list
          </button>
          {canWrite && (currentUserRole === "Owner" || currentUserRole === "Receptionist") && (
            <button
              onClick={() => {
                setAssignServiceType('Checkup');
                setAssignEngineer(activeCycle.assignedCheckupEngineer || '');
                setAssignDateTime('');
                setAssignNotes('');
                setIsAssignOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
            >
              Assign
            </button>
          )}
        </div>

        {/* Company & contact */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">{activeCycle.companyName}</h1>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-slate-600 text-sm">
            <span className="font-semibold">{customerName}</span>
            {phone !== "N/A" && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">|</span>
                <span className="font-mono text-slate-900">{phone}</span>
              </span>
            )}
          </div>
        </div>

        {/* Basic Details grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-slate-200/80 pt-4 text-xs">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">City</p>
            <p className="mt-0.5 text-slate-800 font-medium">{activeOrder?.city || customerObj?.city || "N/A"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Branch</p>
            <p className="mt-0.5 text-slate-800 font-medium">{activeOrder?.branch || "Main"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Address</p>
            <p className="mt-0.5 text-slate-800 leading-relaxed">{customerObj?.address || "N/A"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order ID</p>
            <p className="mt-0.5 text-slate-800 font-mono font-medium">{activeCycle.orderId}</p>
          </div>
          {activeOrder?.productsSelected && activeOrder.productsSelected.length > 0 && (
            <div className="col-span-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Products</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {activeOrder.productsSelected.map((prod, idx) => (
                  <span key={idx} className="inline-flex items-center text-xs bg-white border border-slate-200 rounded-lg px-2 py-0.5 font-medium text-slate-700">
                    {prod.productName} <strong className="ml-1 text-slate-400">x{prod.quantity}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Next Due Service */}
        {nextDueServiceInfo && (
          <div className="border-t border-slate-200/80 pt-4 space-y-3">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Next Due Service</p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Type</p>
                <p className="mt-0.5 text-slate-800 font-semibold">{nextDueServiceInfo.type}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Due Date</p>
                <p className="mt-0.5 text-slate-800 font-semibold">{new Date(nextDueServiceInfo.date).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Due In</p>
                <p className={`mt-0.5 font-semibold ${
                  nextDueServiceInfo.days !== null && nextDueServiceInfo.days <= 0
                    ? "text-red-600"
                    : nextDueServiceInfo.days !== null && nextDueServiceInfo.days <= 7
                    ? "text-amber-600"
                    : "text-slate-800"
                }`}>
                  {nextDueServiceInfo.days === null ? "N/A" : nextDueServiceInfo.days <= 0 ? "Overdue" : `${nextDueServiceInfo.days} days`}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Engineer</p>
                <p className="mt-0.5 text-slate-800 font-semibold">{nextDueServiceInfo.engineer}</p>
              </div>
            </div>

          </div>
        )}

        {/* Pending Service Visits */}
        <div className="border-t border-slate-200/80 pt-4 space-y-2">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Service Visits</p>
          {pendingServiceVisits.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No pending service visits.</p>
          ) : (
            pendingServiceVisits.map(v => {
              const badgeCls = v.status === 'Issue Found'
                ? 'bg-orange-100 text-orange-800 border-orange-300'
                : v.status === 'Started'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-amber-100 text-amber-800 border-amber-200';
              return (
                <div key={v.id} className="flex justify-between items-center text-xs border-b border-slate-100 py-2.5 last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">{v.serviceType === 'Major' ? 'Main Service' : 'Checkup'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {v.salesperson || 'Unassigned'}
                      {v.scheduledAt && ` · ${new Date(v.scheduledAt).toLocaleDateString('en-IN')}`}
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border shrink-0 ${badgeCls}`}>{v.status}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Tab Toggle */}
        <div className="border-t border-slate-200/80 pt-4">
          <div className="flex border-b border-slate-200/85">
            {[
              { id: "docs", label: "Docs" },
              { id: "history", label: "Service History" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveServiceTab(tab.id as "docs" | "history")}
                className={`flex-1 pb-2 text-center text-xs font-semibold border-b-2 transition ${
                  activeServiceTab === tab.id
                    ? "border-[#173c2d] text-[#173c2d]"
                    : "border-transparent text-slate-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pt-4">
            {activeServiceTab === "docs" && (
              <p className="text-xs text-slate-400 italic">No documents uploaded yet.</p>
            )}

            {activeServiceTab === "history" && (
              timelineItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No services logged yet.</p>
              ) : (
                <div className="relative pl-5 border-l border-slate-200 space-y-5 ml-2">
                  {timelineItems.map(item => (
                    <div key={item.id} className="relative animate-fadeIn">
                      <span className={`absolute -left-[22px] top-1 h-3.5 w-3.5 rounded-full border-4 bg-white ${item.type === "Checkup" ? "border-emerald-500" : "border-indigo-500"}`} />
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.type === "Checkup" ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"}`}>
                              {item.type}
                            </span>
                            <span className="text-xs font-semibold text-slate-800">Service Logged</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">{new Date(item.date).toLocaleDateString('en-IN')}</span>
                        </div>
                        <p className="text-xs text-slate-500">Engineer: <strong className="text-slate-700">{item.engineer}</strong></p>
                        {item.reports.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.reports.map((rep, idx) => (
                              <button key={idx} onClick={() => setPreviewFileName(rep.name)} className="inline-flex items-center gap-1 text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 hover:text-[#173c2d] hover:border-emerald-300 transition">
                                <FileText size={11} />{rep.name}
                              </button>
                            ))}
                            {item.quotation && (
                              <button onClick={() => setPreviewFileName(item.quotation!)} className="inline-flex items-center gap-1 text-[10px] bg-amber-50 border border-amber-200 rounded px-2 py-0.5 text-amber-700 hover:text-amber-900 transition">
                                <FileText size={11} />{item.quotation}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* ASSIGN SERVICE VISIT MODAL */}
        {isAssignOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
              <div className="border-b p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">Assign Service Visit</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{activeCycle.companyName}</p>
                </div>
                <button onClick={() => setIsAssignOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!assignEngineer) return alert('Please select a Service Engineer.');
                  if (!assignDateTime) return alert('Please select a Schedule Date & Time.');
                  const order = orders.find(o => o.id === activeCycle.orderId);
                  const customerObjLocal = customers.find(c => c.name.toLowerCase() === activeCycle.companyName.toLowerCase());
                  await addVisit({
                    visitType: 'Service',
                    serviceType: assignServiceType,
                    companyName: activeCycle.companyName,
                    contactPerson: customerObjLocal?.contactPerson || undefined,
                    phone: customerObjLocal?.phone || undefined,
                    city: order?.city || customerObjLocal?.city || undefined,
                    address: customerObjLocal?.address || undefined,
                    branch: order?.branch || undefined,
                    orderId: activeCycle.orderId,
                    salesperson: assignEngineer,
                    scheduledAt: new Date(assignDateTime).toISOString(),
                    notesText: assignNotes || undefined,
                  });
                  await assignServiceTrackEngineer(activeCycle.orderId, assignServiceType === 'Major' ? 'Major' : 'Checkup', assignEngineer);
                  setIsAssignOpen(false);
                  setAssignEngineer('');
                  setAssignDateTime('');
                  setAssignNotes('');
                }}
                className="p-5 space-y-4"
              >
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Service Type <span className="text-rose-500">*</span>
                  <select
                    value={assignServiceType}
                    onChange={e => setAssignServiceType(e.target.value as 'Checkup' | 'Major')}
                    className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                  >
                    <option value="Checkup">45-Day Checkup</option>
                    <option value="Major">Major Service (2000-Hr)</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Assign Service Engineer <span className="text-rose-500">*</span>
                  <select
                    value={assignEngineer}
                    onChange={e => setAssignEngineer(e.target.value)}
                    className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    required
                  >
                    <option value="">-- Select Engineer --</option>
                    {serviceEngineersList.map(eng => <option key={eng.name} value={eng.name}>{eng.name}</option>)}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Schedule Date & Time <span className="text-rose-500">*</span>
                  <input
                    type="datetime-local"
                    value={assignDateTime}
                    onChange={e => setAssignDateTime(e.target.value)}
                    className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    required
                  />
                </label>

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Notes (optional)
                  <textarea
                    value={assignNotes}
                    onChange={e => setAssignNotes(e.target.value)}
                    placeholder="Any instructions or remarks..."
                    rows={3}
                    className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65] resize-none"
                  />
                </label>

                <div className="flex gap-2 pt-1 border-t">
                  <Button type="button" onClick={() => setIsAssignOpen(false)} variant="ghost" className="flex-1 text-xs text-slate-600 rounded-lg">Cancel</Button>
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg">Assign & Schedule</Button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                  {(currentUserRole === "Owner" || currentUserRole === "Receptionist") ? (
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                      Assign Service Engineer <span className="text-rose-500">*</span>
                      <select value={checkupEngineer} onChange={e => setCheckupEngineer(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]" required>
                        <option value="">-- Select Engineer --</option>
                        {serviceEngineersList.map(eng => <option key={eng.name} value={eng.name}>{eng.name}</option>)}
                      </select>
                    </label>
                  ) : (
                    <div className="text-xs font-semibold text-slate-700 bg-slate-50 border p-3 rounded-lg">
                      <span>Service Engineer:</span>
                      <p className="font-bold text-slate-900 mt-1">{checkupEngineer}</p>
                    </div>
                  )}
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Checkup Report File {currentUserRole !== "Owner" && <span className="text-rose-500">*</span>}
                    <input type="file" ref={checkupFileRef} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setCheckupReportName(file.name); }} required={currentUserRole !== "Owner" && !checkupReportName} />
                    <div className="flex gap-2 items-center">
                      <Button type="button" onClick={() => checkupFileRef.current?.click()} className="bg-[#173c2d]/10 hover:bg-[#173c2d]/25 text-[#173c2d] text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5">
                        <Upload size={14} /><span>Choose Report</span>
                      </Button>
                      <span className="text-xs text-slate-500 truncate max-w-[240px]">{checkupReportName || "No file selected"}</span>
                    </div>
                  </label>
                  <div className="space-y-3 pt-2.5 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={issueFound} onChange={e => setIssueFound(e.target.checked)} className="rounded border-slate-350 text-[#173c2d] focus:ring-[#173c2d]" />
                      <span>Machinery Issue Found? Upload Service Quotation.</span>
                    </label>
                    {issueFound && (
                      <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5 animate-fadeIn">
                        Service Quotation File
                        <input type="file" ref={quoteFileRef} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setServiceQuoteName(file.name); }} />
                        <div className="flex gap-2 items-center">
                          <Button type="button" onClick={() => quoteFileRef.current?.click()} className="bg-[#173c2d]/10 hover:bg-[#173c2d]/25 text-[#173c2d] text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5">
                            <Upload size={14} /><span>Choose Quotation</span>
                          </Button>
                          <span className="text-xs text-slate-500 truncate max-w-[240px]">{serviceQuoteName || "No file selected"}</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                  <Button type="button" onClick={() => setIsCheckupOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">Cancel</Button>
                  <Button type="submit" className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4">Log Visit Complete</Button>
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
                  <p className="text-xs text-slate-500">{activeCycle.companyName} - Current: {activeCycle.currentHourMeter} hrs</p>
                </div>
                <button onClick={() => setIsMajorOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
              </div>
              <form onSubmit={handleMajorSubmit}>
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  {(currentUserRole === "Owner" || currentUserRole === "Receptionist") ? (
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                      Assign Service Engineer <span className="text-rose-500">*</span>
                      <select value={majorEngineer} onChange={e => setMajorEngineer(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]" required>
                        <option value="">-- Select Engineer --</option>
                        {serviceEngineersList.map(eng => <option key={eng.name} value={eng.name}>{eng.name}</option>)}
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
                      Pre-Service Report {currentUserRole !== "Owner" && <span className="text-rose-500">*</span>}
                      <input type="file" ref={preFileRef} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setPreReportName(file.name); }} required={currentUserRole !== "Owner" && !preReportName} />
                      <div className="flex gap-2 items-center">
                        <Button type="button" onClick={() => preFileRef.current?.click()} className="bg-[#173c2d]/10 hover:bg-[#173c2d]/25 text-[#173c2d] text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5">
                          <Upload size={13} /><span>Pre-Service</span>
                        </Button>
                        <span className="text-xs text-slate-500 truncate max-w-[120px]">{preReportName || "Optional for Owner"}</span>
                      </div>
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                      Post-Service Report {currentUserRole !== "Owner" && <span className="text-rose-500">*</span>}
                      <input type="file" ref={postFileRef} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setPostReportName(file.name); }} required={currentUserRole !== "Owner" && !postReportName} />
                      <div className="flex gap-2 items-center">
                        <Button type="button" onClick={() => postFileRef.current?.click()} className="bg-[#173c2d]/10 hover:bg-[#173c2d]/25 text-[#173c2d] text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5">
                          <Upload size={13} /><span>Post-Service</span>
                        </Button>
                        <span className="text-xs text-slate-500 truncate max-w-[120px]">{postReportName || "Optional for Owner"}</span>
                      </div>
                    </label>
                  </div>
                  <div className="space-y-2 border-t pt-3">
                    <h4 className="text-xs font-bold text-slate-700">Spare Parts Log (Auto-decrements Inventory)</h4>
                    <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-lg border">
                      <label className="text-xs text-slate-600 flex flex-col gap-1 flex-1">
                        Pick Part
                        <select value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)} className="rounded border bg-white px-2.5 py-1.5 text-xs outline-none">
                          <option value="">-- Choose Spare --</option>
                          {inventory.map(part => <option key={part.id} value={part.id}>{part.name} (Stock: {part.quantity})</option>)}
                        </select>
                      </label>
                      <label className="text-xs text-slate-600 flex flex-col gap-1 w-20">
                        Quantity
                        <input type="number" min="1" value={selectedPartQty} onChange={e => setSelectedPartQty(e.target.value)} className="rounded border px-2.5 py-1.5 text-xs outline-none" />
                      </label>
                      <Button type="button" onClick={handleAddPartToUsage} className="bg-[#173c2d] hover:bg-[#204a3b] text-white px-3 py-1.5 text-xs">Add</Button>
                    </div>
                    <div className="space-y-1">
                      {partsUsedList.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No parts logged yet.</p>
                      ) : (
                        partsUsedList.map(item => {
                          const partObj = inventory.find(i => i.id === item.partId);
                          return (
                            <div key={item.partId} className="flex justify-between items-center bg-white border rounded p-2 text-xs">
                              <div><strong>{partObj?.name || item.partId}</strong><span className="text-[10px] text-slate-400 ml-2">Qty: {item.qty}</span></div>
                              <button type="button" onClick={() => handleRemovePartFromUsage(item.partId)} className="text-red-500 hover:underline text-[10px]">Remove</button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                  <Button type="button" onClick={() => setIsMajorOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">Cancel</Button>
                  <Button type="submit" className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4">Log Major Service Complete</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Preview Modal */}
        <DocumentPreviewModal isOpen={!!previewFileName} fileName={previewFileName} onClose={() => setPreviewFileName(null)} />
      </div>
    );
  }
  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8 space-y-6 animate-fadeIn">
      {/* Filters (directly below top navbar) */}
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
            Show Near Due / Overdue Only
          </span>
        </label>
      </div>

      {/* Listing Cards */}
      <div className="flex flex-col gap-4">
        {filteredCycles.length === 0 ? (
          <div className="py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200 shadow-sm">
            No service records found.
          </div>
        ) : (
          filteredCycles.map(sc => {
            // Compute status
            // Statuses: checkup due, service due, complaint pending, service overdue
            const hasPendingComplaint = complaints.some(c => c.orderId === sc.orderId && c.status !== "Resolved/Closed");
            
            const checkupDays = getDaysRemaining(sc.nextCheckupDate);
            const majorDays = sc.nextMajorServiceDate ? getDaysRemaining(sc.nextMajorServiceDate) : null;
            
            let cardStatus: "checkup due" | "service due" | "complaint pending" | "service overdue" | "on track" = "on track";
            
            if (hasPendingComplaint) {
              cardStatus = "complaint pending";
            } else if ((checkupDays !== null && checkupDays < 0) || (majorDays !== null && majorDays < 0)) {
              cardStatus = "service overdue";
            } else if (checkupDays !== null && checkupDays <= 7) {
              cardStatus = "checkup due";
            } else if (majorDays !== null && majorDays <= 7) {
              cardStatus = "service due";
            }

            // Get customer details
            const orderObj = orders.find(o => o.id === sc.orderId);
            const customerObj = customers.find(c => c.name.toLowerCase() === sc.companyName.toLowerCase());
            const customerName = customerObj?.contactPerson || orderObj?.companyName || "N/A";
            const phone = customerObj?.phone || "N/A";
            const city = orderObj?.city || customerObj?.city || "N/A";

            // Next due date and service type which is due
            const checkupDate = new Date(sc.nextCheckupDate);
            const majorDate = sc.nextMajorServiceDate ? new Date(sc.nextMajorServiceDate) : null;
            
            let nextDueDateStr = sc.nextCheckupDate;
            let nextDueType = "Checkup";
            
            if (majorDate && majorDate < checkupDate) {
              nextDueDateStr = sc.nextMajorServiceDate!;
              nextDueType = "Main Service";
            }

            // Last visit date and type
            const lastCheckup = sc.lastCheckupDate ? new Date(sc.lastCheckupDate) : null;
            const lastMajor = sc.lastMajorServiceDate ? new Date(sc.lastMajorServiceDate) : null;
            
            let lastVisitDateStr = "None";
            let lastVisitType = "N/A";
            
            if (lastCheckup && (!lastMajor || lastCheckup >= lastMajor)) {
              lastVisitDateStr = lastCheckup.toLocaleDateString('en-IN');
              lastVisitType = "Checkup";
            } else if (lastMajor && (!lastCheckup || lastMajor > lastCheckup)) {
              lastVisitDateStr = lastMajor.toLocaleDateString('en-IN');
              lastVisitType = "Main Service";
            }

            // Status badges styles
            const statusStyles = {
              "complaint pending": "bg-rose-100 text-rose-800 border-rose-200",
              "service overdue": "bg-red-100 text-red-850 border-red-200",
              "checkup due": "bg-amber-100 text-amber-800 border-amber-200",
              "service due": "bg-blue-100 text-blue-800 border-blue-200",
              "on track": "bg-emerald-105 text-emerald-805 border-emerald-200"
            };

            return (
              <div
                key={sc.orderId}
                onClick={() => setSelectedCycleId(sc.orderId)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Column: Company Name & Status */}
                <div className="flex flex-col gap-1.5 md:w-1/3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base leading-tight hover:text-emerald-800 transition-colors">
                      {sc.companyName}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${statusStyles[cardStatus]}`}>
                      {cardStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{customerName}</span>
                    <span className="mx-1.5 text-slate-300">|</span>
                    <span>{phone}</span>
                    <span className="mx-1.5 text-slate-300">|</span>
                    <span className="text-slate-600 font-medium">{city}</span>
                  </div>
                </div>

                {/* Right Column: Info Blocks (Next Due & Last Visit) */}
                <div className="flex flex-col sm:flex-row gap-3 md:w-2/3 justify-end">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-w-[180px]">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Next Due</span>
                      <p className="font-semibold text-slate-800">
                        {new Date(nextDueDateStr).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg ml-2">
                      {nextDueType}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-w-[180px]">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Visit</span>
                      <p className="font-semibold text-slate-800">{lastVisitDateStr}</p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg ml-2">
                      {lastVisitType}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
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
