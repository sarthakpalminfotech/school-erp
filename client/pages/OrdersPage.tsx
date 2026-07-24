import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, FileText, ArrowLeft, Upload, CheckCircle, Clock, Check, X, AlertTriangle, ShieldAlert, Trash2, Calendar, MessageSquare, CreditCard, Play, Edit3, Filter, Wrench } from "lucide-react";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { useAppState, Order, Quotation, PaymentEntry, TimelineLog, ServiceReport } from "@/hooks/useAppState";
import { NotesComponent } from "@/components/NotesComponent";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";

export const OrdersPage: React.FC = () => {
  const {
    orders, updateOrderStatus, uploadQuotation, toggleQuotationApproval,
    deleteQuotation, addNoteToOrder, logComplaint, payments, addPayment,
    togglePaymentComplete, timelineLogs, customers, addOrder, employees,
    currentUserRole, currentSimulatedUser, cities, products, updateOrderValue, updateOrderDetails,
    suppliers, hasWritePermission, serviceCycles, uploadServiceReport, deleteServiceReport
  } = useAppState();

  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialOrderId = searchParams.get("orderId") || "";

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("All");
  const canWrite = hasWritePermission("Orders");
  
  // Selection
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);

  useEffect(() => {
    const qSearch = searchParams.get("search");
    if (qSearch !== null) setSearch(qSearch);
    const qOrderId = searchParams.get("orderId");
    if (qOrderId !== null) {
      setSelectedOrderId(qOrderId);
    }
  }, [searchParams]);

  // Manual Add Order Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formCustomer, setFormCustomer] = useState("");
  const [formGstNumber, setFormGstNumber] = useState("");
  const [formSales, setFormSales] = useState("");

  useEffect(() => {
    if (!formSales && employees.length > 0) {
      if (currentUserRole === "Sales Person") {
        setFormSales(currentSimulatedUser);
      } else {
        const salesPersons = employees.filter(e => e.role === "Sales Person" || e.role === "Owner");
        if (salesPersons.length > 0) {
          setFormSales(salesPersons[0].name);
        }
      }
    }
  }, [employees, currentUserRole, currentSimulatedUser, formSales]);
  const [formCity, setFormCity] = useState("Ahmedabad");
  const [formProducts, setFormProducts] = useState<{ productId: string; quantity: number; invoiceAmount: number }[]>([
    { productId: "", quantity: 1, invoiceAmount: 0 }
  ]);
  
  // Quotation Upload form state
  const [uploadType, setUploadType] = useState<Quotation["type"]>("Technical");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);

  // Report Upload form state
  const [reportUploadType, setReportUploadType] = useState<"Checkup" | "Pre-Service" | "Post-Service">("Checkup");
  const reportFileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit Order Value state
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  
  // Payment Add form state
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  
  // Log Complaint State
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintText, setComplaintText] = useState("");

  // Assign Engineer State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState("");

  // Supplier & Delivery Partner Assignment State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedDeliveryPartner, setSelectedDeliveryPartner] = useState("");

  // Edit details modal state (For Owner)
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editSalesperson, setEditSalesperson] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editSupplierId, setEditSupplierId] = useState("");
  const [editDeliveryPartner, setEditDeliveryPartner] = useState("");
  const [editAssignedEngineer, setEditAssignedEngineer] = useState("");
  const [editGstNumber, setEditGstNumber] = useState("");
  const [editOrderValueAmount, setEditOrderValueAmount] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [formBranch, setFormBranch] = useState("");
  const [isAddingNewBranch, setIsAddingNewBranch] = useState(false);

  const matchedCustomer = useMemo(() => {
    if (!formCustomer.trim()) return null;
    return customers.find(c => c.name.toLowerCase() === formCustomer.toLowerCase()) || null;
  }, [formCustomer, customers]);

  // Timeline View State
  const [showAllTimeline, setShowAllTimeline] = useState(false);

  // Active Order Detail object
  const activeOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Active Service Cycle object
  const activeCycle = useMemo(() => {
    return serviceCycles.find(c => c.orderId === activeOrder?.id) || null;
  }, [serviceCycles, activeOrder]);

  // Compiled Service Reports
  const activeReports = useMemo(() => {
    if (!activeCycle) return [];
    return [
      ...activeCycle.checkupReports,
      ...activeCycle.preServiceReports,
      ...activeCycle.postServiceReports
    ].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [activeCycle]);

  // Order Ledger object
  const activeLedger = useMemo(() => {
    if (!selectedOrderId) return null;
    return payments.find(p => p.orderId === selectedOrderId) || { orderId: selectedOrderId, entries: [], isComplete: false };
  }, [payments, selectedOrderId]);

  // running total for payment
  const paymentTotals = useMemo(() => {
    if (!activeLedger || !activeOrder) return { received: 0, balance: 0 };
    const total = activeLedger.entries.reduce((sum, entry) => sum + entry.amount, 0);
    const orderValue = activeOrder.orderValue || 0;
    return {
      received: total,
      balance: Math.max(0, orderValue - total)
    };
  }, [activeLedger, activeOrder]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = `${o.id} ${o.companyName} ${o.city}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const handleManualAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer.trim()) return;

    // Validate products
    const validProducts = formProducts.filter(p => p.productId !== "");
    if (validProducts.length === 0) {
      alert("At least one product is required.");
      return;
    }

    // Map products to database structure
    const dbProductsSelected = validProducts.map(p => {
      const prodObj = products.find(pr => pr.id === p.productId);
      return {
        productId: p.productId,
        productName: prodObj ? prodObj.name : "Unknown Product",
        quantity: p.quantity,
        invoiceAmount: p.invoiceAmount
      };
    });

    const orderValue = dbProductsSelected.reduce((sum, p) => sum + (p.quantity * p.invoiceAmount), 0);

    // Find customer or create mock customer ID
    const customerObj = customers.find(c => c.name.toLowerCase() === formCustomer.toLowerCase());
    const customerId = customerObj ? customerObj.id : `C-${Date.now()}`;
    const orderId = `ORD-${Date.now()}`;

    await addOrder({
      id: orderId,
      customerId,
      companyName: formCustomer,
      salesperson: formSales || (currentUserRole === "Sales Person" ? currentSimulatedUser : (employees.filter(e => e.role === "Sales Person" || e.role === "Owner")[0]?.name || "")),
      city: formCity,
      branch: formBranch,
      status: "In Process",
      productsSelected: dbProductsSelected,
      orderValue: orderValue,
      gstNumber: formGstNumber
    });

    setIsAddOpen(false);
    setSelectedOrderId(orderId);
    setFormProducts([{ productId: "", quantity: 1, invoiceAmount: 0 }]);
    setFormBranch("");
    setFormGstNumber("");
    setIsAddingNewBranch(false);
    setFormSales(currentUserRole === "Sales Person" ? currentSimulatedUser : (employees.filter(e => e.role === "Sales Person" || e.role === "Owner")[0]?.name || ""));
  };

  const handleOpenAddOrder = () => {
    setFormCustomer("");
    setFormSales(currentUserRole === "Sales Person" ? currentSimulatedUser : (employees.filter(e => e.role === "Sales Person" || e.role === "Owner")[0]?.name || ""));
    setFormCity("Ahmedabad");
    setFormProducts([{ productId: "", quantity: 1, invoiceAmount: 0 }]);
    setFormBranch("");
    setFormGstNumber("");
    setIsAddingNewBranch(false);
    setIsAddOpen(true);
  };

  const openEditDetails = () => {
    if (!activeOrder) return;
    setEditCompanyName(activeOrder.companyName);
    setEditSalesperson(activeOrder.salesperson);
    setEditCity(activeOrder.city);
    setEditSupplierId(activeOrder.supplierId || "");
    setEditDeliveryPartner(activeOrder.deliveryPartner || "");
    setEditAssignedEngineer(activeOrder.assignedEngineer || "");
    setEditGstNumber(activeOrder.gstNumber || "");
    setEditOrderValueAmount(String(activeOrder.orderValue || 0));
    setEditBranch(activeOrder.branch || "Main");
    setIsEditDetailsOpen(true);
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !payAmount) return;

    addPayment(selectedOrderId, Number(payAmount), payNote || "Partial Payment");
    setPayAmount("");
    setPayNote("");
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !complaintText.trim()) return;

    logComplaint(selectedOrderId, complaintText);
    setComplaintText("");
    setIsComplaintOpen(false);
  };

  // Get active order timeline logs
  const activeTimelineLogs = useMemo(() => {
    if (!selectedOrderId) return [];
    return timelineLogs.filter(log => log.orderId === selectedOrderId);
  }, [timelineLogs, selectedOrderId]);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "In Process": return "bg-sky-100 text-sky-800 border-sky-200";
      case "Payment Pending": return "bg-violet-100 text-violet-800 border-violet-200";
      case "Order Placed with Supplier": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Commissioning Pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Commissioned/Completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (activeOrder) {
    return (
      <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8 space-y-6">
        {/* Detail Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedOrderId(null); setShowAllTimeline(false); }}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-[#15251f]">{activeOrder.companyName}</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Order File ID: <strong>{activeOrder.id}</strong> · Location: <strong>{activeOrder.city}</strong> · Branch: <strong>{activeOrder.branch || "Main"}</strong> · Sales: <strong>{activeOrder.salesperson}</strong>
                {activeOrder.assignedEngineer && <> · Service Eng: <strong>{activeOrder.assignedEngineer}</strong></>}
                {activeOrder.supplierId && (
                  <> · Supplier: <strong>{suppliers.find(s => s.id === activeOrder.supplierId)?.name || activeOrder.supplierId}</strong></>
                )}
                {activeOrder.deliveryPartner && <> · Delivery Partner: <strong>{activeOrder.deliveryPartner}</strong></>}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Change Dropdown (Shifted here and styled like badge dropdown) */}
            {canWrite && (
              <div className="flex-1 md:flex-none">
                <select
                  value={activeOrder.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as Order["status"];
                    if (newStatus === "Commissioned/Completed" && !activeOrder.gstNumber) {
                      alert("GST Number is compulsory before the order can be marked as Commissioned. Please add it via 'Edit Order Details'.");
                      return;
                    }
                    if (newStatus === "Commissioning Pending") {
                      if (currentUserRole === "Service Engineer") {
                        // Service Engineers cannot assign engineers for Commissioning Pending status
                        updateOrderStatus(activeOrder.id, "Commissioning Pending");
                      } else {
                        setIsAssignOpen(true);
                      }
                    } else if (newStatus === "Order Placed with Supplier") {
                      setSelectedSupplierId(activeOrder.supplierId || "");
                      setSelectedDeliveryPartner(activeOrder.deliveryPartner || "");
                      setIsSupplierModalOpen(true);
                    } else {
                      updateOrderStatus(activeOrder.id, newStatus);
                    }
                  }}
                  className={`w-full md:w-auto inline-flex items-center rounded-xl px-3 py-2.5 text-xs font-bold border outline-none cursor-pointer appearance-none pr-8 bg-no-repeat bg-right ${getStatusColor(activeOrder.status)}`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='currentColor' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`, backgroundPosition: 'calc(100% - 9px) center' }}
                >
                  {currentUserRole === "Service Engineer" ? (
                    <>
                      {activeOrder.status !== "Commissioning Pending" && activeOrder.status !== "Commissioned/Completed" && (
                        <option value={activeOrder.status} disabled>{activeOrder.status}</option>
                      )}
                      <option value="Commissioning Pending">Commissioning Pending</option>
                      <option value="Commissioned/Completed">Commissioned/Completed</option>
                    </>
                  ) : (
                    <>
                      <option value="In Process">In Process</option>
                      <option value="Payment Pending">Payment Pending</option>
                      <option value="Order Placed with Supplier">Order Placed with Supplier</option>
                      <option value="Commissioning Pending">Commissioning Pending</option>
                      <option value="Commissioned/Completed">Commissioned/Completed</option>
                    </>
                  )}
                </select>
              </div>
            )}
            
            {canWrite && (
              <Button
                onClick={() => setIsComplaintOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl px-3 sm:px-4 py-2.5 flex items-center gap-1.5 shadow-sm"
              >
                <ShieldAlert size={14} />
                <span className="hidden sm:inline">Log Complaint</span>
              </Button>
            )}

            {currentUserRole === "Owner" && canWrite && (
              <Button
                onClick={openEditDetails}
                className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl px-3 sm:px-4 py-2.5 flex items-center gap-1.5 shadow-sm"
              >
                <Edit3 size={14} />
                <span className="hidden sm:inline">Edit Order Details</span>
              </Button>
            )}
          </div>
        </div>

        {/* Action Alerts for Owner */}
        {currentUserRole === "Owner" && (
          <div className="flex flex-col gap-3">
            {activeOrder.status === "Order Placed with Supplier" && !activeOrder.deliveryPartner && (
              <div 
                onClick={openEditDetails}
                className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 cursor-pointer hover:bg-amber-100/70 active:scale-[0.99] transition-all"
              >
                <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-800 text-sm">Action Required: Delivery Partner Missing</h4>
                  <p className="text-xs text-amber-700 mt-0.5">This order has been placed with the supplier but no delivery partner is assigned. Please assign one in Edit Order Details.</p>
                </div>
              </div>
            )}
            
            {activeOrder.status === "Commissioning Pending" && !activeOrder.assignedEngineer && (
              <div 
                onClick={openEditDetails}
                className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 cursor-pointer hover:bg-amber-100/70 active:scale-[0.99] transition-all"
              >
                <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-800 text-sm">Action Required: Service Engineer Missing</h4>
                  <p className="text-xs text-amber-700 mt-0.5">This order is pending commissioning but no service engineer is assigned. Please assign one in Edit Order Details.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail Body */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Column 1: Document Upload & Approval */}
          <div className="xl:col-span-2 space-y-6">
            {/* Ordered Products Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={17} className="text-[#173c2d]" />
                  <span>Ordered Products</span>
                </h3>
              </div>
              <div className="space-y-2">
                {activeOrder.productsSelected && activeOrder.productsSelected.length > 0 ? (
                  <div className="space-y-2">
                    {activeOrder.productsSelected.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm text-slate-705 bg-slate-50 border rounded-xl p-3">
                        <div>
                          <p className="font-semibold text-slate-900">{p.productName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Quantity: {p.quantity} · Price per Unit: ₹{p.invoiceAmount.toLocaleString()}</p>
                        </div>
                        <span className="font-bold text-slate-900">₹{(p.quantity * p.invoiceAmount).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-sm font-bold text-slate-805 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                      <span>Total Invoice Value</span>
                      {isEditingValue ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 rounded border px-2 py-1 text-sm outline-none font-bold text-slate-800"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              if (activeOrder && editValue !== "") {
                                updateOrderValue(activeOrder.id, parseFloat(editValue));
                                setIsEditingValue(false);
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-3 text-xs"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsEditingValue(false)}
                            className="text-slate-500 h-7 px-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-800 text-base">₹{(activeOrder.orderValue || 0).toLocaleString()}</span>
                          {currentUserRole === "Owner" && canWrite && (
                            <button
                              onClick={() => {
                                setEditValue(String(activeOrder.orderValue || 0));
                                setIsEditingValue(true);
                              }}
                              className="text-xs text-blue-600 hover:underline font-semibold"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-4">No products recorded for this order.</p>
                )}
              </div>
            </div>

            {/* Quotation Management Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={17} className="text-[#173c2d]" />
                  <span>Quotation Management</span>
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">PDF, Word, or Images</span>
              </div>

              {/* Quotation Upload form (Hidden for Service Engineer) */}
              {currentUserRole !== "Service Engineer" && canWrite && (
                <div className="flex flex-row gap-3 items-center bg-slate-50 p-4 rounded-xl border w-full">
                  <div className="flex-1 min-w-0">
                    <select
                      value={uploadType}
                      onChange={e => setUploadType(e.target.value as Quotation["type"])}
                      className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Bank">Bank</option>
                      <option value="Service">Service</option>
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && selectedOrderId) {
                          uploadQuotation(selectedOrderId, uploadType, file, false);
                        }
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-full bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold shadow-sm"
                    >
                      <Upload size={14} />
                      <span className="whitespace-nowrap">Upload Document</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Quotation List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Uploaded Quotations</h4>
                {activeOrder.quotations.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-6">No quotations uploaded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeOrder.quotations.map(quo => (
                      <div key={quo.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-800 shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <p 
                              className="text-sm font-semibold text-slate-800 truncate cursor-pointer hover:text-[#173c2d] hover:underline transition-colors" 
                              title={quo.fileName}
                              onClick={() => setPreviewFileName(quo.fileName)}
                            >
                              {quo.fileName}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">{quo.type} · {quo.fileSize} · Uploaded by {quo.uploadedBy} · {quo.uploadedAt}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Approval Status Toggle (Visual status badge only) */}
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              quo.approved
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}>
                              {quo.approved ? "Approved" : "Pending Approval"}
                            </span>

                            {/* Switch toggle (Visual only, Owner only) */}
                            {currentUserRole === "Owner" && (
                              <button
                                onClick={() => toggleQuotationApproval(activeOrder.id, quo.id)}
                                className="text-[10px] text-[#173c2d] hover:underline font-bold px-1.5"
                                title="Toggle Approval"
                              >
                                Toggle
                              </button>
                            )}
                          </div>

                          {/* Delete button (Hidden for Service Engineer) */}
                          {currentUserRole !== "Service Engineer" && canWrite && (
                            <button
                              onClick={() => deleteQuotation(activeOrder.id, quo.id)}
                              className="text-slate-400 hover:text-red-500 p-1"
                              title="Delete file"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Report Management Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                  <Wrench size={17} className="text-[#173c2d]" />
                  <span>Report Management</span>
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">Checkup & Maintenance Reports</span>
              </div>

              {/* Report Upload Form */}
              {canWrite && (
                <div className="flex flex-row gap-3 items-center bg-slate-50 p-4 rounded-xl border w-full">
                  <div className="flex-1 min-w-0">
                    <select
                      value={reportUploadType}
                      onChange={e => setReportUploadType(e.target.value as any)}
                      className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                    >
                      <option value="Checkup">Checkup Report</option>
                      <option value="Pre-Service">Pre-Service Report</option>
                      <option value="Post-Service">Post-Service Report</option>
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      ref={reportFileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && selectedOrderId) {
                          uploadServiceReport(selectedOrderId, reportUploadType, file);
                        }
                        if (reportFileInputRef.current) reportFileInputRef.current.value = "";
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={() => reportFileInputRef.current?.click()} 
                      className="w-full bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold shadow-sm"
                    >
                      <Upload size={14} />
                      <span className="whitespace-nowrap">Upload Report</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Report List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Uploaded Service Reports</h4>
                {activeReports.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-6">No service reports uploaded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeReports.map(rep => (
                      <div key={rep.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-800 shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <p 
                              className="text-sm font-semibold text-slate-800 truncate cursor-pointer hover:text-[#173c2d] hover:underline transition-colors" 
                              title={rep.fileName}
                              onClick={() => setPreviewFileName(rep.fileName)}
                            >
                              {rep.fileName}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">{rep.type} · Uploaded by {rep.uploadedBy} · {new Date(rep.uploadedAt).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {canWrite && (
                            <button
                              onClick={() => deleteServiceReport(activeOrder.id, rep.id)}
                              className="text-slate-400 hover:text-red-500 p-1"
                              title="Delete report"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Ledger Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard size={17} className="text-[#173c2d]" />
                  <span>Payment Ledger</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Status:</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition ${
                      paymentTotals.balance <= 0
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : paymentTotals.received > 0
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }`}
                  >
                    {paymentTotals.balance <= 0 ? (
                      <><CheckCircle size={12} /><span>Payment Completed</span></>
                    ) : paymentTotals.received > 0 ? (
                      <><Clock size={12} /><span>Partial Payment Done (Pending)</span></>
                    ) : (
                      <><X size={12} /><span>Payment Pending</span></>
                    )}
                  </span>
                </div>
              </div>

              {/* Running total */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Order Value</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">₹{(activeOrder.orderValue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Received</span>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">₹{paymentTotals.received.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining Balance</span>
                  <p className={`text-sm font-bold mt-0.5 ${paymentTotals.balance === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                    ₹{paymentTotals.balance.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Add Payment form */}
              {canWrite && (
                <form onSubmit={handleAddPaymentSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-4 rounded-xl border">
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Payment Amount (₹)
                    <input
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                      required
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Remarks / Notes
                    <input
                      value={payNote}
                      onChange={e => setPayNote(e.target.value)}
                      placeholder="e.g. NEFT transfer Ref: 4810"
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    />
                  </label>
                  <Button type="submit" className="bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center justify-center gap-1.5 rounded-lg py-2">
                    <Plus size={14} />
                    <span>Log Payment</span>
                  </Button>
                </form>
              )}

              {/* List of payments */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Transactions Ledger</h4>
                {activeLedger.entries.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-4">No payment entries registered.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeLedger.entries.map(entry => (
                      <div key={entry.id} className="flex justify-between py-2 text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">₹{entry.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500">{entry.note}</p>
                        </div>
                        <div className="text-right text-slate-400 font-medium">
                          {entry.date}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Timeline & Notes */}
          <div className="space-y-6">
            {/* Reusable Notes component */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-900 border-b pb-3">Operational Notes</h3>
              <NotesComponent
                notes={[]}
                readOnly={!canWrite}
                onAddNote={(text, photo, voice) => addNoteToOrder(activeOrder.id, text, photo, voice)}
              />
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-display font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock size={16} className="text-[#173c2d]" />
                  <span>Activity Log Timeline</span>
                </h3>
                <button
                  onClick={() => setShowAllTimeline(!showAllTimeline)}
                  className="text-[10px] font-bold text-[#173c2d] hover:underline"
                >
                  {showAllTimeline ? "Show Latest 3" : `View All (${activeTimelineLogs.length})`}
                </button>
              </div>

              <div className="relative pl-4 border-l border-slate-150 space-y-4 py-1.5">
                {activeTimelineLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No activity logs recorded.</p>
                ) : (
                  (showAllTimeline ? activeTimelineLogs : activeTimelineLogs.slice(0, 3)).map(log => (
                    <div key={log.id} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-[20.5px] top-1.5 h-2.5 w-2.5 rounded-full border bg-white border-[#173c2d]" />
                      <div className="font-semibold text-slate-800">{log.action}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{log.user} · {new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LOG COMPLAINT DIALOG */}
        {isComplaintOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
              <div className="border-b p-5 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-slate-900">Log Machine Complaint</h3>
                <button onClick={() => setIsComplaintOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleComplaintSubmit}>
                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-500">
                    Submit ticket details for machinery errors. The issue will be registered in the Complaints panel.
                  </p>
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Describe Machinery Issue / Fault <span className="text-rose-500">*</span>
                    <textarea
                      value={complaintText}
                      onChange={e => setComplaintText(e.target.value)}
                      placeholder="e.g. Compressor shutting down every 20 minutes with error E04 (overheating)..."
                      className="w-full min-h-[90px] rounded-lg border p-2.5 text-sm outline-none focus:border-[#5b8d65]"
                      required
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                  <Button type="button" onClick={() => setIsComplaintOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg px-4">
                    Submit Ticket
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Engineer Modal */}
        {isAssignOpen && activeOrder && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-scaleUp">
              <div className="border-b p-5 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-slate-900">Assign Service Engineer</h3>
                <button onClick={() => setIsAssignOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-600">Assign an engineer to commission the compressor at <strong className="text-emerald-700">{activeOrder.city}</strong>.</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {employees
                    .filter(emp => emp.role === "Service Engineer")
                    .sort((a, b) => {
                      if (a.city === activeOrder.city && b.city !== activeOrder.city) return -1;
                      if (a.city !== activeOrder.city && b.city === activeOrder.city) return 1;
                      return 0;
                    })
                    .map(emp => (
                      <div
                        key={emp.name}
                        onClick={() => setSelectedEngineer(emp.name)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          selectedEngineer === emp.name 
                            ? "border-[#5b8d65] bg-emerald-50 ring-1 ring-[#5b8d65]" 
                            : "border-slate-200 hover:border-[#5b8d65]"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-800 text-sm">{emp.name}</span>
                          {emp.city === activeOrder.city && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                              Nearest ({emp.city})
                            </span>
                          )}
                        </div>
                        {emp.city !== activeOrder.city && (
                          <span className="text-xs text-slate-400 mt-1 block">Base: {emp.city || "Unknown"}</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                <Button type="button" onClick={() => setIsAssignOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedEngineer) {
                      updateOrderStatus(activeOrder.id, "Commissioning Pending", selectedEngineer);
                      setIsAssignOpen(false);
                      setSelectedEngineer("");
                    }
                  }} 
                  disabled={!selectedEngineer}
                  className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4 disabled:opacity-50"
                >
                  Confirm Assignment
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Supplier & Delivery Partner Assignment Modal */}
        {isSupplierModalOpen && activeOrder && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-scaleUp">
              <div className="border-b p-5 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-slate-900">Select Supplier & Delivery Partner</h3>
                <button onClick={() => setIsSupplierModalOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
              </div>

              <div className="p-5 space-y-4">
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Finished Goods Supplier <span className="text-rose-500">*</span>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name} ({sup.city})</option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Delivery Partner (Service Engineer)
                  <select
                    value={selectedDeliveryPartner}
                    onChange={e => setSelectedDeliveryPartner(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                  >
                    <option value="">-- Choose Service Engineer --</option>
                    {employees.filter(emp => emp.role === "Service Engineer").map(emp => {
                      const isNearby = emp.city && activeOrder?.city && emp.city.toLowerCase() === activeOrder.city.toLowerCase();
                      return (
                        <option key={emp.name} value={emp.name}>
                          {emp.name} {isNearby ? "(Nearby)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                <Button type="button" onClick={() => setIsSupplierModalOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (selectedSupplierId) {
                      await updateOrderDetails(activeOrder.id, {
                        status: "Order Placed with Supplier",
                        supplierId: selectedSupplierId,
                        deliveryPartner: selectedDeliveryPartner || null
                      });
                      setIsSupplierModalOpen(false);
                    } else {
                      alert("Please select a supplier.");
                    }
                  }}
                  className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4"
                >
                  Confirm Supplier Placement
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Owner Edit Order Details Modal */}
        {isEditDetailsOpen && activeOrder && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-scaleUp overflow-y-auto max-h-[90vh]">
              <div className="border-b p-5 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-slate-900">Edit Order Details (Owner Mode)</h3>
                <button onClick={() => setIsEditDetailsOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
              </div>

              <div className="p-5 space-y-4">
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Client Company Name
                  <input
                    value={editCompanyName}
                    onChange={e => setEditCompanyName(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  GST Number
                  <input
                    value={editGstNumber}
                    onChange={e => setEditGstNumber(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65] uppercase"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Salesperson
                    <select
                      value={editSalesperson}
                      onChange={e => setEditSalesperson(e.target.value)}
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    >
                      {employees.filter(emp => emp.role === "Sales Person" || emp.role === "Owner").map(emp => (
                        <option key={emp.name} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    City
                    <select
                      value={editCity}
                      onChange={e => setEditCity(e.target.value)}
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    >
                      {cities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Branch Name
                    <input
                      value={editBranch}
                      onChange={e => setEditBranch(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Supplier (F.G. Supplier)
                    <select
                      value={editSupplierId}
                      onChange={e => setEditSupplierId(e.target.value)}
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    >
                      <option value="">-- None --</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Delivery Partner
                    <select
                      value={editDeliveryPartner}
                      onChange={e => setEditDeliveryPartner(e.target.value)}
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    >
                      <option value="">-- None --</option>
                      {employees.filter(emp => emp.role === "Service Engineer").map(emp => {
                        const targetCity = editCity || activeOrder.city;
                        const isNearby = emp.city && targetCity && emp.city.toLowerCase() === targetCity.toLowerCase();
                        return (
                          <option key={emp.name} value={emp.name}>
                            {emp.name} {isNearby ? "(Nearby)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Assigned Service Engineer (Commissioning)
                    <select
                      value={editAssignedEngineer}
                      onChange={e => setEditAssignedEngineer(e.target.value)}
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    >
                      <option value="">-- None --</option>
                      {employees.filter(emp => emp.role === "Service Engineer").map(emp => {
                        const targetCity = editCity || activeOrder.city;
                        const isNearby = emp.city && targetCity && emp.city.toLowerCase() === targetCity.toLowerCase();
                        return (
                          <option key={emp.name} value={emp.name}>
                            {emp.name} {isNearby ? "(Nearby)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Total Order Value (₹)
                    <input
                      type="number"
                      value={editOrderValueAmount}
                      onChange={e => setEditOrderValueAmount(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                <Button type="button" onClick={() => setIsEditDetailsOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await updateOrderDetails(activeOrder.id, {
                      companyName: editCompanyName,
                      salesperson: editSalesperson,
                      city: editCity,
                      branch: editBranch,
                      supplierId: editSupplierId || null,
                      deliveryPartner: editDeliveryPartner || null,
                      assignedEngineer: editAssignedEngineer || null,
                      orderValue: parseFloat(editOrderValueAmount) || 0
                    });
                    setIsEditDetailsOpen(false);
                  }}
                  className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-[#58705c] uppercase tracking-wider">Order Management</p>
        <div className="flex items-center gap-4">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#15251f]">Orders</h1>
          {canWrite && (
            <Button onClick={handleOpenAddOrder} className="bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center gap-1.5 rounded-xl py-1 px-3.5 text-xs h-[32px] shadow-sm">
              <Plus size={14} />
              <span>Manual Add Order</span>
            </Button>
          )}
        </div>
        <p className="text-sm text-slate-500">Manage delivery tracking, approval timelines, Quotations, and client payments.</p>
      </div>

      {/* Search panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID, company, or city..."
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

      {/* Listing (Table for desktop, Cards for mobile) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Client Company</th>
                <th className="px-5 py-3.5">City</th>
                <th className="px-5 py-3.5">Sales Rep</th>
                <th className="px-5 py-3.5">Order Value</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Quotations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">No orders found.</td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="hover:bg-slate-50/50 cursor-pointer transition border-b-[6px] border-white bg-slate-50/30"
                  >
                    <td className="px-6 py-4 font-bold text-[#173c2d] text-sm">
                      <div className="flex items-center gap-2">
                        {order.id}
                        {currentUserRole === "Owner" && (
                          (order.status === "Order Placed with Supplier" && !order.deliveryPartner) ||
                          (order.status === "Commissioning Pending" && !order.assignedEngineer)
                        ) && (
                          <span title="Action Required: Missing Assignment"><AlertTriangle size={14} className="text-amber-500" /></span>
                        )}
                        {currentUserRole === "Owner" && order.quotations.some(q => !q.approved) && (
                          <span title="Quotation Pending Approval" className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse inline-block shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900 text-sm">
                      <div>{order.companyName}</div>
                      {/* Products Summary */}
                      {order.productsSelected && order.productsSelected.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {order.productsSelected.map((prod, pIdx) => (
                            <span key={pIdx} className="inline-flex items-center gap-1 rounded bg-slate-105 px-1.5 py-0.5 text-[9px] text-slate-500 font-semibold border border-slate-200">
                              {prod.productName} (x{prod.quantity})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{order.city}</td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{order.salesperson}</td>
                    <td className="px-5 py-4 font-bold text-slate-905 text-sm">
                      ₹{(order.orderValue || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {order.quotations.length} uploaded
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (Properly Separated) */}
        <div className="block md:hidden space-y-4 bg-slate-100 p-3 rounded-2xl">
          {filteredOrders.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200">No orders found.</div>
          ) : (
            filteredOrders.map(order => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="bg-white border-2 border-slate-200 p-4 rounded-xl shadow-md space-y-3 hover:bg-slate-50/50 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#173c2d] text-sm flex items-center gap-2">
                    {order.id}
                    {currentUserRole === "Owner" && (
                      (order.status === "Order Placed with Supplier" && !order.deliveryPartner) ||
                      (order.status === "Commissioning Pending" && !order.assignedEngineer)
                    ) && (
                      <span title="Action Required: Missing Assignment"><AlertTriangle size={14} className="text-amber-500" /></span>
                    )}
                    {currentUserRole === "Owner" && order.quotations.some(q => !q.approved) && (
                      <span title="Quotation Pending Approval" className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse inline-block shrink-0" />
                    )}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{order.companyName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{order.city} · {order.salesperson}</p>
                  {/* Products Summary */}
                  {order.productsSelected && order.productsSelected.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {order.productsSelected.map((prod, pIdx) => (
                        <span key={pIdx} className="inline-flex items-center gap-1 rounded bg-slate-105 px-1.5 py-0.5 text-[9px] text-slate-500 font-semibold border border-slate-200">
                          {prod.productName} (x{prod.quantity})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-450 pt-2 border-t flex justify-between">
                  <span>Value: <strong className="text-slate-800">₹{(order.orderValue || 0).toLocaleString()}</strong></span>
                  <span>Files: {order.quotations.length} uploaded</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">Filters</h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                Filter by Status
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                >
                  <option value="All">All Statuses</option>
                  <option value="In Process">In Process</option>
                  <option value="Payment Pending">Payment Pending</option>
                  <option value="Order Placed with Supplier">Order Placed with Supplier</option>
                  <option value="Commissioning Pending">Commissioning Pending</option>
                  <option value="Commissioned/Completed">Commissioned/Completed</option>
                </select>
              </label>
            </div>
            <div className="flex justify-between items-center border-t p-4 bg-slate-50">
              <Button 
                type="button" 
                onClick={() => setStatusFilter("All")} 
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

      {/* MANUAL ADD ORDER DIALOG */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">Create Order Manually</h3>
              <button onClick={() => setIsAddOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>

            <form onSubmit={handleManualAddOrder}>
              <div className="p-5 space-y-4">
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Client Company Name <span className="text-rose-500">*</span>
                  <input
                    value={formCustomer}
                    onChange={e => setFormCustomer(e.target.value)}
                    placeholder="e.g. Navkar Packaging"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                    required
                  />
                </label>

                {matchedCustomer ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-3 rounded-xl bg-slate-50/50">
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
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
                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
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
                      <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                        New Branch Name <span className="text-rose-500">*</span>
                        <input
                          value={formBranch}
                          onChange={e => setFormBranch(e.target.value)}
                          placeholder="e.g. GIDC Vatva"
                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                          required
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                    Branch Name <span className="text-rose-500">*</span>
                    <input
                      value={formBranch}
                      onChange={e => setFormBranch(e.target.value)}
                      placeholder="e.g. Head Office"
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                      required
                    />
                  </label>
                )}

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Sales Representative
                  <select
                    value={formSales}
                    onChange={e => setFormSales(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                  >
                    {employees.filter(emp => emp.role === "Sales Person" || emp.role === "Owner").map(emp => (
                      <option key={emp.name} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  City
                  <select
                    value={formCity}
                    onChange={e => setFormCity(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65]"
                  >
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  GST Number (Optional)
                  <input
                    value={formGstNumber}
                    onChange={e => setFormGstNumber(e.target.value)}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[#5b8d65] uppercase"
                  />
                </label>

                {/* Product Selection List */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2.5">
                    <h4 className="text-xs font-bold text-slate-800">Select Products <span className="text-rose-500">*</span></h4>
                    <Button
                      type="button"
                      onClick={() => setFormProducts([...formProducts, { productId: "", quantity: 1, invoiceAmount: 0 }])}
                      variant="outline"
                      size="sm"
                      className="text-[10px] py-1 px-2 border-slate-300"
                    >
                      <Plus size={10} /> Add Product
                    </Button>
                  </div>

                  {formProducts.map((p, idx) => (
                    <div key={idx} className="flex gap-2 items-end mb-2">
                      <label className="flex-1 text-[11px] font-medium text-slate-600">
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
                          required
                          className="mt-1 w-full rounded-lg border bg-white px-2 py-2 text-xs outline-none focus:border-[#5b8d65]"
                        >
                          <option value="" disabled>Select Product...</option>
                          {products.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} {prod.model ? `(${prod.model})` : ""} - ₹{prod.price || 0}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="w-16 text-[11px] font-medium text-slate-600">
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
                          required
                          className="mt-1 w-full rounded-lg border px-2 py-2 text-xs outline-none focus:border-[#5b8d65]"
                        />
                      </label>

                      <label className="w-24 text-[11px] font-medium text-slate-600">
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
                          className="mt-1 w-full rounded-lg border px-2 py-2 text-xs outline-none focus:border-[#5b8d65]"
                        />
                      </label>

                      {formProducts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormProducts(formProducts.filter((_, i) => i !== idx))}
                          className="mb-1 rounded p-1.5 text-rose-500 hover:bg-rose-50 transition"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="mt-2 text-right bg-slate-50 p-2 rounded-lg border text-xs font-semibold text-[#173c2d]">
                    Total Amount: <span className="text-emerald-700 font-extrabold text-sm">₹{formProducts.reduce((sum, p) => sum + (p.quantity * p.invoiceAmount), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                <Button type="button" onClick={() => setIsAddOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4">
                  Add Order
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
