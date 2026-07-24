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
    currentUserRole, currentSimulatedUser, cities, products, updateOrderValue, updateOrderDetails, dismissOrderAlert,
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
  const [deliveryDateTime, setDeliveryDateTime] = useState("");
  const [commissioningScheduleDateTime, setCommissioningScheduleDateTime] = useState("");
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDateTime, setRescheduleDateTime] = useState("");

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
  const [activeDetailsTab, setActiveDetailsTab] = useState<"overview" | "docs" | "payments" | "timeline">("overview");

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
      status: "Payment Pending",
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

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !payAmount) return;

    const amt = Number(payAmount);
    await addPayment(selectedOrderId, amt, payNote || "Partial Payment");
    setPayAmount("");
    setPayNote("");

    // Calculate if balance reaches 0
    const currentTotal = activeLedger?.entries.reduce((sum, entry) => sum + entry.amount, 0) || 0;
    const totalWithNew = currentTotal + amt;
    const orderValue = activeOrder?.orderValue || 0;
    const newBalance = Math.max(0, orderValue - totalWithNew);

    if (activeOrder && activeOrder.status === "Payment Pending") {
      setSelectedSupplierId(activeOrder.supplierId || "");
      setSelectedDeliveryPartner(activeOrder.deliveryPartner || "");
      setDeliveryDateTime("");
      setIsSupplierModalOpen(true);
    }
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
      case "Payment Pending": return "bg-violet-100 text-violet-800 border-violet-200";
      case "Order Placed with Supplier": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Commissioning Pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Commissioned/Completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const renderOrderDetails = () => {
    if (!activeOrder) return null;
    return (
      <>
        <div className="min-h-screen bg-slate-50 text-slate-800 px-4 py-5 space-y-5 animate-fadeIn">
        {/* Detail Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setSelectedOrderId(null); setShowAllTimeline(false); }}
            className="text-[#173c2d] font-semibold text-sm flex items-center gap-1"
          >
            ← Back to list
          </button>
          <div className="flex items-center gap-2">
            {/* Status Change Dropdown */}
            {(canWrite || currentUserRole === "Service Engineer") && (
              <div className="shrink-0">
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
                        if (confirm("Are you sure you want to transition this order status to Commissioning Pending?")) {
                          updateOrderStatus(activeOrder.id, "Commissioning Pending");
                        }
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
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold cursor-pointer outline-none bg-white ${getStatusColor(activeOrder.status)}`}
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
              <button
                onClick={() => setIsComplaintOpen(true)}
                className="p-2 border bg-white rounded-lg hover:bg-slate-100 shadow-sm text-rose-600"
                title="Log Complaint"
              >
                <ShieldAlert size={16} />
              </button>
            )}

            {currentUserRole === "Owner" && canWrite && (
              <button
                onClick={openEditDetails}
                className="p-2 border bg-white rounded-lg hover:bg-slate-100 shadow-sm text-slate-650"
                title="Edit Order Details"
              >
                <Edit3 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Action Alerts */}
        {(currentUserRole === "Owner" || currentUserRole === "Service Engineer") && (
          <div className="flex flex-col gap-2.5">
            {currentUserRole === "Owner" && activeOrder.status === "Order Placed with Supplier" && !activeOrder.deliveryPartner && (
              <div 
                onClick={openEditDetails}
                className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex gap-2.5 text-xs font-medium cursor-pointer"
              >
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-amber-800">Action Required: Delivery Partner Missing</strong>
                  <p className="text-slate-600 mt-0.5">Please assign a delivery partner in Edit Order Details.</p>
                </div>
              </div>
            )}
            
            {currentUserRole === "Owner" && activeOrder.status === "Commissioning Pending" && !activeOrder.assignedEngineer && (
              <div 
                onClick={() => {
                  setSelectedEngineer("");
                  setCommissioningScheduleDateTime("");
                  setIsAssignOpen(true);
                }}
                className="bg-amber-50 border border-amber-205 p-3.5 rounded-xl flex gap-2.5 text-xs font-medium cursor-pointer hover:bg-amber-100/50 transition shadow-sm"
              >
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0 animate-pulse" />
                <div>
                  <strong className="text-amber-800">Action Required: Schedule Commissioning & Assign Service Engineer</strong>
                  <p className="text-slate-600 mt-0.5">Please click here to assign a service engineer and schedule the commissioning date & time.</p>
                </div>
              </div>
            )}

            {currentUserRole === "Owner" && activeOrder.ownerRescheduleAlert && (
              <div 
                className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex justify-between items-center gap-2.5 text-xs font-medium"
              >
                <div className="flex gap-2.5">
                  <AlertTriangle size={16} className="text-rose-600 mt-0.5 shrink-0 animate-bounce" />
                  <div>
                    <strong className="text-rose-800">Reschedule Alert: Appointment Changed by Engineer</strong>
                    <p className="text-slate-600 mt-0.5">The Service Engineer rescheduled this appointment to: {activeOrder.deliveryDate ? new Date(activeOrder.deliveryDate).toLocaleString() : "N/A"}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => dismissOrderAlert(activeOrder.id, 'owner_reschedule')}
                  variant="ghost" 
                  className="text-rose-700 hover:bg-rose-100 text-xs px-2.5 py-1.5 rounded-lg shrink-0"
                >
                  Acknowledge
                </Button>
              </div>
            )}

            {currentUserRole === "Service Engineer" && activeOrder.engineerRescheduleAlert && (
              <div 
                className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex justify-between items-center gap-2.5 text-xs font-medium"
              >
                <div className="flex gap-2.5">
                  <AlertTriangle size={16} className="text-rose-600 mt-0.5 shrink-0 animate-bounce" />
                  <div>
                    <strong className="text-rose-800">Reschedule Alert: Appointment Changed by Owner</strong>
                    <p className="text-slate-600 mt-0.5">The Owner rescheduled this appointment to: {activeOrder.deliveryDate ? new Date(activeOrder.deliveryDate).toLocaleString() : "N/A"}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => dismissOrderAlert(activeOrder.id, 'engineer_reschedule')}
                  variant="ghost" 
                  className="text-rose-700 hover:bg-rose-100 text-xs px-2.5 py-1.5 rounded-lg shrink-0"
                >
                  Acknowledge
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Core details */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{activeOrder.companyName}</h1>
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 border-t border-slate-200/80 pt-3 text-xs text-slate-650">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order ID</p>
              <p className="mt-0.5 text-slate-800 font-mono font-bold">{activeOrder.id}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">City</p>
              <p className="mt-0.5 text-slate-800">{activeOrder.city}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Branch</p>
              <p className="mt-0.5 text-slate-800">{activeOrder.branch || "Main"}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sales Representative</p>
              <p className="mt-0.5 text-slate-800">{activeOrder.salesperson}</p>
            </div>
            {activeOrder.gstNumber && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GST Number</p>
                <p className="mt-0.5 text-slate-800 font-mono uppercase">{activeOrder.gstNumber}</p>
              </div>
            )}
            {activeOrder.assignedEngineer && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Engineer</p>
                <p className="mt-0.5 text-slate-800">{activeOrder.assignedEngineer}</p>
              </div>
            )}
             {activeOrder.supplierId && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Supplier</p>
                <p className="mt-0.5 text-slate-800">
                  {suppliers.find(s => s.id === activeOrder.supplierId)?.name || activeOrder.supplierId}
                </p>
              </div>
            )}
            {activeOrder.deliveryDate && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scheduled Date & Time</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-slate-805 font-medium">{new Date(activeOrder.deliveryDate).toLocaleString()}</p>
                  {(currentUserRole === "Owner" || currentUserRole === "Service Engineer") && (
                    <button
                      onClick={() => {
                        setRescheduleDateTime(activeOrder.deliveryDate ? activeOrder.deliveryDate.substring(0, 16) : "");
                        setIsRescheduleOpen(true);
                      }}
                      className="p-1 rounded hover:bg-slate-100 text-[#5b8d65] hover:text-[#4a7251] transition"
                      title="Reschedule Appointment"
                    >
                      <Calendar size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
            {activeOrder.deliveryPartner && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Delivery Partner</p>
                <p className="mt-0.5 text-slate-800">{activeOrder.deliveryPartner}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tab List */}
        <div className="flex border-b border-slate-200/85 pt-2">
          {[
            { id: "overview", label: "Overview" },
            { id: "docs", label: "Docs" },
            { id: "payments", label: "Payments" },
            { id: "timeline", label: "Timeline" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveDetailsTab(tab.id as any)}
              className={`flex-1 pb-2 text-center text-xs font-semibold border-b-2 transition ${
                activeDetailsTab === tab.id
                  ? "border-[#173c2d] text-[#173c2d]"
                  : "border-transparent text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="pt-2">
          {activeDetailsTab === "overview" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered Products</h3>
              {activeOrder.productsSelected && activeOrder.productsSelected.length > 0 ? (
                <div className="space-y-1.5">
                  {activeOrder.productsSelected.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                      <div>
                        <p className="font-semibold text-slate-850">{p.productName}</p>
                        <p className="text-[10px] text-slate-450 mt-0.5">Qty: {p.quantity} · Price: ₹{p.invoiceAmount.toLocaleString()}</p>
                      </div>
                      <span className="font-bold text-slate-800">₹{(p.quantity * p.invoiceAmount).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                    <span>Total Invoice Value</span>
                    {isEditingValue ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20 rounded border px-2 py-1 text-xs font-bold text-slate-800 outline-none"
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
                          className="bg-emerald-650 hover:bg-emerald-700 text-white h-6 px-2 text-[10px]"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditingValue(false)}
                          className="text-slate-500 h-6 px-1.5 text-[10px]"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-800">₹{(activeOrder.orderValue || 0).toLocaleString()}</span>
                        {currentUserRole === "Owner" && canWrite && (
                          <button
                            onClick={() => {
                              setEditValue(String(activeOrder.orderValue || 0));
                              setIsEditingValue(true);
                            }}
                            className="text-[10px] text-blue-600 hover:underline font-semibold"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No products recorded.</p>
              )}
            </div>
          )}

          {activeDetailsTab === "docs" && (
            <div className="space-y-5">
              {/* Quotations */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quotation Documents</h3>
                {currentUserRole !== "Service Engineer" && canWrite && (
                  <div className="flex gap-2 items-center bg-white border border-slate-200 p-2.5 rounded-xl">
                    <select
                      value={uploadType}
                      onChange={e => setUploadType(e.target.value as Quotation["type"])}
                      className="rounded-lg border bg-white px-2 py-1.5 text-xs outline-none focus:border-[#5b8d65] flex-1"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Bank">Bank</option>
                      <option value="Service">Service</option>
                    </select>
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
                      className="bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center gap-1.5 rounded-lg py-1.5 px-3 text-xs font-semibold"
                    >
                      <Upload size={12} />
                      <span>Upload</span>
                    </Button>
                  </div>
                )}
                <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  {activeOrder.quotations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No quotations uploaded.</p>
                  ) : (
                    activeOrder.quotations.map(quo => (
                      <div key={quo.id} className="flex justify-between items-center p-2.5 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate cursor-pointer hover:underline" onClick={() => setPreviewFileName(quo.fileName)}>{quo.fileName}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate">{quo.type} · {quo.fileSize}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border ${quo.approved ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                            {quo.approved ? "Approved" : "Pending"}
                          </span>
                          {currentUserRole === "Owner" && (
                            <button onClick={() => toggleQuotationApproval(activeOrder.id, quo.id)} className="text-[9px] text-[#173c2d] hover:underline font-bold">Toggle</button>
                          )}
                          {currentUserRole !== "Service Engineer" && canWrite && (
                            <button onClick={() => deleteQuotation(activeOrder.id, quo.id)} className="text-rose-600 hover:text-rose-700 p-0.5"><Trash2 size={13} /></button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Service Reports */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Reports</h3>
                {canWrite && (
                  <div className="flex gap-2 items-center bg-white border border-slate-200 p-2.5 rounded-xl">
                    <select
                      value={reportUploadType}
                      onChange={e => setReportUploadType(e.target.value as any)}
                      className="rounded-lg border bg-white px-2 py-1.5 text-xs outline-none focus:border-[#5b8d65] flex-1"
                    >
                      <option value="Checkup">Checkup Report</option>
                      <option value="Pre-Service">Pre-Service Report</option>
                      <option value="Post-Service">Post-Service Report</option>
                    </select>
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
                      className="bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center gap-1.5 rounded-lg py-1.5 px-3 text-xs font-semibold"
                    >
                      <Upload size={12} />
                      <span>Upload</span>
                    </Button>
                  </div>
                )}
                <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  {activeReports.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No reports uploaded.</p>
                  ) : (
                    activeReports.map(rep => (
                      <div key={rep.id} className="flex justify-between items-center p-2.5 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate cursor-pointer hover:underline" onClick={() => setPreviewFileName(rep.fileName)}>{rep.fileName}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate">{rep.type} · By {rep.uploadedBy}</p>
                        </div>
                        {canWrite && (
                          <button onClick={() => deleteServiceReport(activeOrder.id, rep.id)} className="text-rose-600 hover:text-rose-700 p-0.5 shrink-0"><Trash2 size={13} /></button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeDetailsTab === "payments" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-100/50 rounded-xl border text-center text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Value</span>
                  <p className="font-bold text-slate-805 mt-0.5">₹{(activeOrder.orderValue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Received</span>
                  <p className="font-bold text-emerald-700 mt-0.5">₹{paymentTotals.received.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Balance</span>
                  <p className={`font-bold mt-0.5 ${paymentTotals.balance === 0 ? "text-emerald-700" : "text-amber-700"}`}>₹{paymentTotals.balance.toLocaleString()}</p>
                </div>
              </div>

              {canWrite && (
                <form onSubmit={handleAddPaymentSubmit} className="space-y-3 bg-white border p-3.5 rounded-xl shadow-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Amount (₹)
                      <input
                        type="number"
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        placeholder="e.g. 50000"
                        className="rounded-lg border bg-white px-2 py-1.5 text-xs outline-none focus:border-[#5b8d65]"
                        required
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Remarks
                      <input
                        value={payNote}
                        onChange={e => setPayNote(e.target.value)}
                        placeholder="e.g. NEFT"
                        className="rounded-lg border bg-white px-2 py-1.5 text-xs outline-none focus:border-[#5b8d65]"
                      />
                    </label>
                  </div>
                  <Button type="submit" className="w-full bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold">
                    <Plus size={12} />
                    <span>Log Payment</span>
                  </Button>
                </form>
              )}

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transactions Ledger</h3>
                <div className="divide-y divide-slate-100 bg-white border rounded-xl p-2 px-3 shadow-xs">
                  {activeLedger.entries.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-3">No payment entries registered.</p>
                  ) : (
                    activeLedger.entries.map(entry => (
                      <div key={entry.id} className="flex justify-between py-2 text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">₹{entry.amount.toLocaleString()}</p>
                          <p className="text-[9px] text-slate-450">{entry.note}</p>
                        </div>
                        <span className="text-slate-400 font-medium text-[10px]">{entry.date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeDetailsTab === "timeline" && (
            <div className="space-y-5">
              {/* Operational Notes */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Notes</h3>
                <NotesComponent
                  notes={[]}
                  readOnly={!canWrite}
                  onAddNote={(text, photo, voice) => addNoteToOrder(activeOrder.id, text, photo, voice)}
                />
              </div>

              {/* Activity Timeline */}
              <div className="space-y-3.5 border-t border-slate-200/80 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Log Timeline</h3>
                  {activeTimelineLogs.length > 3 && (
                    <button
                      onClick={() => setShowAllTimeline(!showAllTimeline)}
                      className="text-[10px] font-bold text-[#173c2d] hover:underline"
                    >
                      {showAllTimeline ? "Show Latest 3" : `View All (${activeTimelineLogs.length})`}
                    </button>
                  )}
                </div>
                <div className="relative pl-4 border-l border-slate-200 space-y-4 py-1.5 ml-1">
                  {activeTimelineLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No activity logs recorded.</p>
                  ) : (
                    (showAllTimeline ? activeTimelineLogs : activeTimelineLogs.slice(0, 3)).map(log => (
                      <div key={log.id} className="relative text-xs">
                        <span className="absolute -left-[20.5px] top-1 h-2 w-2 rounded-full bg-emerald-500 border border-white" />
                        <div className="font-semibold text-slate-750">{log.action}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{log.user} · {new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
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
                  <Button type="button" onClick={() => setIsComplaintOpen(false)} variant="ghost" className="text-slate-655 text-xs rounded-lg">
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
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
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

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5 pt-2">
                  Schedule Date & Time <span className="text-rose-500">*</span>
                  <input
                    type="datetime-local"
                    value={commissioningScheduleDateTime}
                    onChange={e => setCommissioningScheduleDateTime(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    required
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                <Button type="button" onClick={() => setIsAssignOpen(false)} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    if (selectedEngineer && commissioningScheduleDateTime) {
                      await updateOrderDetails(activeOrder.id, {
                        assignedEngineer: selectedEngineer,
                        deliveryDate: commissioningScheduleDateTime
                      });
                      setIsAssignOpen(false);
                      setSelectedEngineer("");
                      setCommissioningScheduleDateTime("");
                    }
                  }} 
                  disabled={!selectedEngineer || !commissioningScheduleDateTime}
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
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {activeOrder.status === "Payment Pending" ? "Place Order with Supplier" : "Select Supplier & Delivery Partner"}
                </h3>
                <button onClick={() => setIsSupplierModalOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
              </div>

              <div className="p-5 space-y-4">
                {activeOrder.status === "Payment Pending" && (
                  <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-3.5 rounded-xl text-xs font-bold text-center">
                    Place order with supplier
                  </div>
                )}

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

                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  Delivery Date & Time (Optional)
                  <input
                    type="datetime-local"
                    value={deliveryDateTime}
                    onChange={e => setDeliveryDateTime(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                  />
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
                        deliveryPartner: selectedDeliveryPartner || null,
                        deliveryDate: deliveryDateTime || null
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

        {/* Reschedule Appointment Modal */}
        {isRescheduleOpen && activeOrder && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl animate-scaleUp">
              <div className="border-b p-5 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-slate-900">Reschedule Appointment</h3>
                <button onClick={() => setIsRescheduleOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
              </div>

              <div className="p-5 space-y-4">
                <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                  New Date & Time <span className="text-rose-500">*</span>
                  <input
                    type="datetime-local"
                    value={rescheduleDateTime}
                    onChange={e => setRescheduleDateTime(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#5b8d65]"
                    required
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                <Button type="button" onClick={() => setIsRescheduleOpen(false)} variant="ghost" className="text-slate-650 text-xs rounded-lg">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (rescheduleDateTime) {
                      await updateOrderDetails(activeOrder.id, {
                        deliveryDate: rescheduleDateTime
                      });
                      setIsRescheduleOpen(false);
                      setRescheduleDateTime("");
                    }
                  }}
                  disabled={!rescheduleDateTime}
                  className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4"
                >
                  Confirm Reschedule
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
      </>
    );
  };

  return (
    <>
      {activeOrder ? renderOrderDetails() : (
        <section className="mx-auto max-w-[1500px] px-4 py-5 space-y-4">
          {/* Search bar & Filter icon */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search orders by ID, company, or city..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-[#173c2d] focus:ring-1 focus:ring-[#173c2d]/20 transition"
              />
            </div>
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 flex items-center justify-center hover:bg-slate-50 transition shadow-sm text-slate-655 h-[36px] w-[36px]"
              title="Filters"
            >
              <Filter size={16} />
            </button>
          </div>

          {/* Active filter display */}
          {statusFilter !== "All" && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold text-slate-500">Filters:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-105 text-slate-700 text-xs border">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter("All")}><X size={10} /></button>
              </span>
            </div>
          )}

          {/* Cards List Layout */}
          <div className="space-y-3.5">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic text-xs bg-white rounded-xl border">
                No orders found matching current search filters.
              </div>
            ) : (
              filteredOrders.map(order => {
                const cust = customers.find(c => c.id === order.customerId);
                const contactPersonName = cust?.contactPerson || "-";
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-55/20 transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#173c2d] text-sm">{order.companyName}</span>
                          {currentUserRole === "Owner" && (
                            (order.status === "Order Placed with Supplier" && !order.deliveryPartner) ||
                            (order.status === "Commissioning Pending" && !order.assignedEngineer)
                          ) && (
                            <span title="Action Required: Missing Assignment"><AlertTriangle size={14} className="text-amber-500" /></span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">Contact: {contactPersonName}</span>
                      </div>
                      <div onClick={e => e.stopPropagation()}>
                        {(canWrite || currentUserRole === "Service Engineer") ? (
                          <select
                            value={order.status}
                            onClick={e => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newStatus = e.target.value as Order["status"];
                              if (newStatus === "Commissioned/Completed" && !order.gstNumber) {
                                alert("GST Number is compulsory before Commissioning. Open details page to verify.");
                                return;
                              }
                              if (newStatus === "Commissioning Pending") {
                                if (currentUserRole === "Service Engineer") {
                                  if (confirm("Are you sure you want to transition this order status to Commissioning Pending?")) {
                                    updateOrderStatus(order.id, "Commissioning Pending");
                                  }
                                } else {
                                  setSelectedOrderId(order.id);
                                  setIsAssignOpen(true);
                                }
                              } else if (newStatus === "Order Placed with Supplier") {
                                setSelectedOrderId(order.id);
                                setSelectedSupplierId(order.supplierId || "");
                                setSelectedDeliveryPartner(order.deliveryPartner || "");
                                setIsSupplierModalOpen(true);
                              } else {
                                updateOrderStatus(order.id, newStatus);
                              }
                            }}
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold cursor-pointer outline-none appearance-none ${getStatusColor(order.status)}`}
                            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                          >
                            {currentUserRole === "Service Engineer" ? (
                              <>
                                {order.status !== "Commissioning Pending" && order.status !== "Commissioned/Completed" && (
                                  <option value={order.status} disabled>{order.status}</option>
                                )}
                                <option value="Commissioning Pending">Commissioning Pending</option>
                                <option value="Commissioned/Completed">Commissioned/Completed</option>
                              </>
                            ) : (
                              <>
                                <option value="Payment Pending">Payment Pending</option>
                                <option value="Order Placed with Supplier">Order Placed with Supplier</option>
                                <option value="Commissioning Pending">Commissioning Pending</option>
                                <option value="Commissioned/Completed">Commissioned/Completed</option>
                              </>
                            )}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs text-slate-500/90 font-medium">
                      <div>City: <span className="text-slate-800">{order.city || "-"}</span></div>
                      {["Commissioning Pending", "Commissioned/Completed"].includes(order.status) ? (
                        <div>Engineer: <span className="text-slate-800">{order.assignedEngineer || "Pending"}</span></div>
                      ) : (
                        <div>Delivery Partner: <span className="text-slate-800">{order.deliveryPartner || "Pending"}</span></div>
                      )}
                      <div className="col-span-2 flex justify-between pt-1 text-[11px] text-slate-500 border-t mt-1">
                        <span>Value: <strong className="text-slate-800">₹{(order.orderValue || 0).toLocaleString()}</strong></span>
                        <span>Docs: {order.quotations.length} files</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Floating Action Button */}
          {canWrite && (
            <button
              onClick={handleOpenAddOrder}
              className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#173c2d] text-white flex items-center justify-center shadow-lg hover:bg-[#204a3b] transition-all transform hover:scale-105 z-30"
              title="Manual Add Order"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )}
        </section>
      )}

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
    </>
  );
};
