import React, { useState, useMemo } from "react";
import {
  TrendingUp, Users, ClipboardList, Wrench, ShieldAlert, CreditCard,
  AlertTriangle, CheckCircle, Bell, ArrowRight, UserPlus, Phone, MapPin, Play, Clock, ArrowUpDown
} from "lucide-react";
import { useAppState, Lead, Order, Complaint, Part } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const DashboardPage: React.FC = () => {
  const {
    currentUserRole, currentSimulatedUser, leads, orders, complaints, inventory, payments,
    timelineLogs, addLead, employees, cities, serviceCycles, dismissOrderAlert
  } = useAppState();

  const navigate = useNavigate();

  // --- Date Filters for Sales Person ---
  const [salesDateFilter, setSalesDateFilter] = useState("Month"); // Today, Week, Month, Year
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // --- Assigned tickets View All & Sorting states ---
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [ticketSort, setTicketSort] = useState<"default" | "date-early">("default");

  // --- Quick Intake for Receptionist ---
  const [rcCompany, setRcCompany] = useState("");
  const [rcContact, setRcContact] = useState("");
  const [rcPhone, setRcPhone] = useState("");
  const [rcSales, setRcSales] = useState("");
  const [rcCity, setRcCity] = useState("Ahmedabad");
  const [rcAddress, setRcAddress] = useState("");
  const [rcMsg, setRcMsg] = useState("");

  // Dynamically set default salesperson for quick intake
  React.useEffect(() => {
    if (!rcSales && employees.length > 0) {
      const salesPersons = employees.filter(emp => emp.role === "Sales Person" || emp.role === "Owner");
      if (salesPersons.length > 0) {
        setRcSales(salesPersons[0].name);
      }
    }
  }, [employees, rcSales]);

  // Filters Leads for Sales Person based on Date range
  const salesFilteredLeads = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    if (salesDateFilter === "Today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (salesDateFilter === "Week") {
      startDate.setDate(now.getDate() - 7);
    } else if (salesDateFilter === "Month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (salesDateFilter === "Year") {
      startDate.setFullYear(now.getFullYear() - 1);
    } else if (salesDateFilter === "Custom" && customStart) {
      startDate = new Date(customStart);
    }

    const endDate = salesDateFilter === "Custom" && customEnd ? new Date(customEnd) : now;

    return leads.filter(l => {
      const created = new Date(l.createdAt);
      return created >= startDate && created <= endDate;
    });
  }, [leads, salesDateFilter, customStart, customEnd]);

  // Sales Person Lead Status aggregations
  const salesStats = useMemo(() => {
    const total = salesFilteredLeads.length;
    const inProcess = salesFilteredLeads.filter(l => l.status === "In Discussion" || l.status === "In Quotation").length;
    const newLeads = salesFilteredLeads.filter(l => l.status === "New").length;
    const lost = salesFilteredLeads.filter(l => l.status === "Lost").length;
    const win = salesFilteredLeads.filter(l => l.status === "Win" || l.status === "Converted").length;

    return { total, inProcess, newLeads, lost, win };
  }, [salesFilteredLeads]);

  // Owner Financial Summary
  const ownerFinancials = useMemo(() => {
    const totalCollected = payments.reduce((sum, p) => {
      return sum + p.entries.reduce((eSum, entry) => eSum + entry.amount, 0);
    }, 0);
    const activePipelineCount = orders.filter(o => o.status !== "Commissioned/Completed").length;
    return { totalCollected, activePipelineCount };
  }, [payments, orders]);

  // Service Engineer suggestions
  const engineerAssignments = useMemo(() => {
    const name = currentUserRole === "Service Engineer" ? currentSimulatedUser : (employees.filter(e => e.role === "Service Engineer")[0]?.name || "");
    const myComplaints = complaints.filter(c => c.assignedEngineer === name && c.status !== "Resolved/Closed");
    return { name, myComplaints };
  }, [complaints, currentUserRole, currentSimulatedUser, employees]);

  // Combined Service Tickets (Commissioning, Check-up, Main Service, Complaint)
  const myServiceTickets = useMemo(() => {
    const tickets: {
      id: string;
      orderId: string;
      companyName: string;
      city: string;
      type: "Order Delivery" | "Commissioning" | "Check-up" | "Main Service" | "Complaint";
      status: string;
      details?: string;
      date?: string;
    }[] = [];

    const getDaysDiff = (dateStr?: string) => {
      if (!dateStr) return 999;
      const diffTime = new Date(dateStr).getTime() - new Date().getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Process orders for Commissioning, Check-up, and Main Service
    orders.forEach(order => {
      // 1. Order Delivery: when assigned as delivery partner
      if (order.deliveryPartner === currentSimulatedUser) {
        if (currentUserRole !== "Service Engineer" || order.status === "Order Placed with Supplier" || order.status === "Commissioning Pending") {
          tickets.push({
            id: `DEL-${order.id}`,
            orderId: order.id,
            companyName: order.companyName,
            city: order.city,
            type: "Order Delivery",
            status: order.status === "Commissioned/Completed" ? "Completed" : "Pending",
            details: "Assigned as Delivery Partner for order shipment",
            date: order.deliveryDate
          });
        }
      }

      // 2. Commissioning: when assigned as service engineer (assignedEngineer)
      if (order.assignedEngineer === currentSimulatedUser) {
        if (currentUserRole !== "Service Engineer" || order.status === "Commissioning Pending" || order.status === "Commissioned/Completed") {
          tickets.push({
            id: `COMM-${order.id}`,
            orderId: order.id,
            companyName: order.companyName,
            city: order.city,
            type: "Commissioning",
            status: order.status === "Commissioned/Completed" ? "Completed" : "Pending",
            details: "Scheduled commissioning task",
            date: order.deliveryDate
          });
        }

        // 3. Check-up & Main Service: when assigned as service engineer
        const sc = serviceCycles.find(c => c.orderId === order.id);
        if (sc) {
          const checkupDays = getDaysDiff(sc.nextCheckupDate);
          if (showAllTickets || checkupDays <= 10) {
            tickets.push({
              id: `CHK-${order.id}`,
              orderId: order.id,
              companyName: order.companyName,
              city: order.city,
              type: "Check-up",
              status: sc.nextCheckupDate ? `Due: ${sc.nextCheckupDate}` : "Scheduled",
              details: "Standard 45-day Checkup track",
              date: sc.nextCheckupDate
            });
          }
          if (sc.nextMajorServiceDate) {
            const majorDays = getDaysDiff(sc.nextMajorServiceDate);
            if (showAllTickets || majorDays <= 10) {
              tickets.push({
                id: `MAJ-${order.id}`,
                orderId: order.id,
                companyName: order.companyName,
                city: order.city,
                type: "Main Service",
                status: `Due: ${sc.nextMajorServiceDate}`,
                details: "2000-hour Major Service maintenance track",
                date: sc.nextMajorServiceDate
              });
            }
          }
        }
      }
    });

    // 4. Complaint: when assigned as service engineer for an active complaint
    complaints.forEach(comp => {
      if (comp.assignedEngineer === currentSimulatedUser && comp.status !== "Resolved/Closed") {
        tickets.push({
          id: comp.id,
          orderId: comp.orderId,
          companyName: comp.companyName,
          city: comp.city,
          type: "Complaint",
          status: comp.status,
          details: comp.issue,
          date: comp.createdAt
        });
      }
    });

    if (ticketSort === "date-early") {
      tickets.sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 9999999999999;
        const timeB = b.date ? new Date(b.date).getTime() : 9999999999999;
        return timeA - timeB;
      });
    }

    return tickets;
  }, [orders, complaints, serviceCycles, currentSimulatedUser, currentUserRole, showAllTickets, ticketSort]);

  const [rcBranch, setRcBranch] = useState("");

  const handleReceptionistIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rcCompany.trim() || !rcPhone.trim() || !rcBranch.trim()) return;

    addLead({
      company: rcCompany,
      contact: rcContact || undefined,
      phone: rcPhone,
      salesperson: rcSales || (employees.filter(emp => emp.role === "Sales Person" || emp.role === "Owner")[0]?.name || ""),
      city: rcCity,
      branch: rcBranch,
      address: rcAddress,
      status: "New"
    });

    setRcCompany("");
    setRcContact("");
    setRcPhone("");
    setRcBranch("");
    setRcAddress("");
    setRcMsg("Lead intake logged successfully!");
    setTimeout(() => setRcMsg(""), 3500);
  };

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Dashboard Top Banner */}
      <div className="rounded-3xl bg-[#14251f] p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
        {/* Background shape */}
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#b5e36c]/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[#1e3a30] blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8ea79c]">Overview Analytics</span>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mt-1.5">
              Welcome back, <span className="text-[#b5e36c]">{currentUserRole === "Owner" ? "Karan Desai" : currentUserRole}</span>
            </h1>
            <p className="text-xs md:text-sm text-[#c8d8d0] mt-1">Here is a summary of NexAir's operations today.</p>
          </div>
          <div className="text-xs font-semibold px-3 py-2 bg-white/10 rounded-xl border border-white/5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operational Mode: <strong className="text-[#b5e36c] font-bold">{currentUserRole}</strong></span>
          </div>
        </div>
      </div>

      {/* -------------------- OWNER VIEW -------------------- */}
      {currentUserRole === "Owner" && (
        <div className="space-y-6">
          {/* Main counts widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2 hover:shadow-md transition">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Leads Pipeline</span>
                <ClipboardList size={16} />
              </div>
              <p className="text-3xl font-bold text-slate-800">{leads.length}</p>
              <p className="text-[10px] text-slate-400">Prospect entries logged</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2 hover:shadow-md transition">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Active Orders</span>
                <TrendingUp size={16} className="text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-slate-800">{orders.length}</p>
              <p className="text-[10px] text-slate-400">{ownerFinancials.activePipelineCount} delivery tracks in progress</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2 hover:shadow-md transition">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Service Tracks</span>
                <Wrench size={16} />
              </div>
              <p className="text-3xl font-bold text-slate-800">{orders.filter(o => o.status === "Commissioned/Completed").length}</p>
              <p className="text-[10px] text-slate-400">Active machine profiles</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2 hover:shadow-md transition">
              <div className="flex justify-between items-center text-rose-500">
                <span className="text-xs font-bold uppercase tracking-wider">Complaints Open</span>
                <ShieldAlert size={16} />
              </div>
              <p className="text-3xl font-bold text-rose-600">{complaints.filter(c => c.status !== "Resolved/Closed").length}</p>
              <p className="text-[10px] text-rose-500">Pending engineer dispatches</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cash Collected Widget */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <CreditCard size={17} className="text-[#173c2d]" />
                <span>Financial Collections</span>
              </h3>
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-center space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Received</span>
                <p className="text-2xl font-bold text-emerald-950">₹{ownerFinancials.totalCollected.toLocaleString()}</p>
              </div>
              <Button onClick={() => navigate("/ledger")} variant="ghost" className="w-full text-xs font-bold text-[#173c2d] hover:bg-slate-50 flex items-center justify-between">
                <span>View Payment Ledgers</span>
                <ArrowRight size={14} />
              </Button>
            </div>

            {/* Inventory Alerts & Warehouse Logs */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <AlertTriangle size={17} className="text-amber-600" />
                <span>Warehouse Alerts</span>
              </h3>

              {inventory.some(p => p.quantity <= p.threshold) ? (
                <div className="space-y-2">
                  {inventory.filter(p => p.quantity <= p.threshold).map(part => (
                    <div key={part.id} className="flex justify-between items-center p-3 border border-red-100 bg-red-50/50 rounded-xl text-xs">
                      <div>
                        <strong className="text-slate-800">{part.name}</strong>
                        <p className="text-[10px] text-slate-500">Warehouse stock: {part.quantity} units (Threshold: {part.threshold})</p>
                      </div>
                      <span className="text-red-700 font-bold">Needs Restock</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-6">All spare parts are fully stocked.</p>
              )}

              <Button onClick={() => navigate("/inventory")} variant="ghost" className="w-full text-xs font-bold text-[#173c2d] hover:bg-slate-50 flex items-center justify-between">
                <span>Manage Inventory Warehouse</span>
                <ArrowRight size={14} />
              </Button>
            </div>

            {/* Global Timeline Logs */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-900 border-b pb-3 flex items-center gap-1.5">
                <Clock size={16} className="text-[#173c2d]" />
                <span>Recent Company Activity logs</span>
              </h3>

              <div className="pl-3 border-l border-slate-150 space-y-3">
                {timelineLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="text-xs space-y-0.5">
                    <div className="font-semibold text-slate-800">
                      Order <span className="text-[#173c2d]">{log.orderId}</span>: {log.action}
                    </div>
                    <div className="text-[10px] text-slate-400">{log.user} · {new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SALES PERSON VIEW -------------------- */}
      {currentUserRole === "Sales Person" && (
        <div className="space-y-6">
          {/* Filters Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">Filter Leads Performance:</span>
            <div className="flex gap-2 w-full sm:w-auto">
              {["Today", "Week", "Month", "Year", "Custom"].map(f => (
                <button
                  key={f}
                  onClick={() => setSalesDateFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    salesDateFilter === f
                      ? "bg-[#173c2d] text-white border-[#173c2d]"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Picker inputs */}
          {salesDateFilter === "Custom" && (
            <div className="grid grid-cols-2 gap-3 max-w-sm rounded-xl border bg-slate-50 p-3">
              <label className="text-[10px] font-bold text-slate-600">Start Date
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full mt-1 border rounded p-1.5 bg-white" />
              </label>
              <label className="text-[10px] font-bold text-slate-600">End Date
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full mt-1 border rounded p-1.5 bg-white" />
              </label>
            </div>
          )}

          {/* KPI summary widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-2xl border p-5 bg-white shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads Added</span>
              <p className="text-2xl font-bold text-slate-800">{salesStats.total}</p>
            </div>
            <div className="rounded-2xl border p-5 bg-white shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Discussion</span>
              <p className="text-2xl font-bold text-sky-850">{salesStats.inProcess}</p>
            </div>
            <div className="rounded-2xl border p-5 bg-white shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Leads</span>
              <p className="text-2xl font-bold text-amber-800">{salesStats.newLeads}</p>
            </div>
            <div className="rounded-2xl border p-5 bg-white shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opportunities Won</span>
              <p className="text-2xl font-bold text-emerald-800">{salesStats.win}</p>
            </div>
            <div className="rounded-2xl border p-5 bg-white shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opportunities Lost</span>
              <p className="text-2xl font-bold text-rose-800">{salesStats.lost}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads followup scheduling list */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-900 border-b pb-3 flex items-center gap-1.5">
                <Bell size={16} className="text-amber-600" />
                <span>Upcoming Follow-ups & Reminders</span>
              </h3>

              <div className="space-y-2">
                {leads.filter(l => l.followUpDate).length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">No scheduled follow-up reminders found.</p>
                ) : (
                  leads.filter(l => l.followUpDate).map(l => (
                    <div key={l.id} className="flex justify-between items-center p-3 border rounded-xl text-xs bg-slate-50/50 hover:bg-slate-50 transition">
                      <div>
                        <strong className="text-slate-800">{l.company}</strong>
                        <p className="text-[10px] text-slate-400">{l.contact} · {l.phone}</p>
                      </div>
                      <div className="text-right text-amber-700 font-semibold">
                        {new Date(l.followUpDate!).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sales Pipeline list */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-900 border-b pb-3">My Sales pipeline</h3>
              <div className="space-y-2">
                {leads.slice(0, 4).map(l => (
                  <div key={l.id} className="flex justify-between items-center p-2 text-xs border-b">
                    <div>
                      <span className="font-semibold text-slate-800">{l.company}</span>
                      <p className="text-[10px] text-slate-400">{l.city}</p>
                    </div>
                    <span className="font-bold text-slate-500">{l.status}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => navigate("/")} variant="ghost" className="w-full text-xs font-bold text-[#173c2d] flex items-center justify-between">
                <span>Open Leads Pipeline Dashboard</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- RECEPTIONIST VIEW -------------------- */}
      {currentUserRole === "Receptionist" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Lead Intake Form */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="border-b pb-3 flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-900 flex items-center gap-1.5">
                <UserPlus size={17} className="text-[#173c2d]" />
                <span>Call Intake registry Form</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">For Walk-ins / Phone Calls</span>
            </div>

            {rcMsg && (
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" />
                <span>{rcMsg}</span>
              </div>
            )}

            <form onSubmit={handleReceptionistIntake} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                Company Name <span className="text-rose-500">*</span>
                <input value={rcCompany} onChange={e => setRcCompany(e.target.value)} placeholder="e.g. Maruti Tex" className="rounded-lg border px-3 py-2 text-sm outline-none" required />
              </label>

              <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                Contact Number <span className="text-rose-500">*</span>
                <input value={rcPhone} onChange={e => setRcPhone(e.target.value)} placeholder="e.g. +91 99041 81044" className="rounded-lg border px-3 py-2 text-sm outline-none" required />
              </label>

              <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                Contact Person Name
                <input value={rcContact} onChange={e => setRcContact(e.target.value)} placeholder="e.g. Nilesh Patel" className="rounded-lg border px-3 py-2 text-sm outline-none" />
              </label>

              <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                Salesperson Owner
                <select value={rcSales} onChange={e => setRcSales(e.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm outline-none">
                  {employees.filter(emp => emp.role === "Sales Person" || emp.role === "Owner").map(emp => (
                    <option key={emp.name} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                City Base Location
                <select value={rcCity} onChange={e => setRcCity(e.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm outline-none">
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                Branch Name <span className="text-rose-500">*</span>
                <input value={rcBranch} onChange={e => setRcBranch(e.target.value)} placeholder="e.g. Head Office" className="rounded-lg border px-3 py-2 text-sm outline-none" required />
              </label>

              <label className="sm:col-span-2 text-xs font-semibold text-slate-700 flex flex-col gap-1.5">
                Site Address Details
                <textarea value={rcAddress} onChange={e => setRcAddress(e.target.value)} placeholder="Full physical factory location coordinates..." className="rounded-lg border p-2.5 text-sm outline-none min-h-[60px]" />
              </label>

              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" className="bg-[#173c2d] hover:bg-[#204a3b] text-white px-5 rounded-lg">
                  Submit Lead file
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            {/* Unassigned Complaints count */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-900 border-b pb-3">Unassigned complaints</h3>
              <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl text-center space-y-1">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Awaiting Engineer</span>
                <p className="text-3xl font-bold text-rose-950">
                  {complaints.filter(c => c.status === "Open" || !c.assignedEngineer).length} tickets
                </p>
              </div>
              <Button onClick={() => navigate("/complaints")} variant="ghost" className="w-full text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Assign Service Engineers</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SERVICE ENGINEER / ASSIGNED SERVICE TICKETS VIEW -------------------- */}
      {(currentUserRole === "Service Engineer" || myServiceTickets.length > 0) && currentUserRole !== "Owner" && (
        <div className="space-y-6 animate-fadeIn">
          {currentUserRole === "Service Engineer" && orders.some(o => (o.assignedEngineer === currentSimulatedUser || o.deliveryPartner === currentSimulatedUser) && o.engineerAssignAlert) && (
            <div className="space-y-3">
              {orders.filter(o => (o.assignedEngineer === currentSimulatedUser || o.deliveryPartner === currentSimulatedUser) && o.engineerAssignAlert).map(o => {
                const isCommissioning = o.assignedEngineer === currentSimulatedUser;
                const visitType = isCommissioning ? "Commissioning" : "Order Delivery";
                return (
                  <div 
                    key={o.id} 
                    className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
                        <strong className="text-emerald-800 text-sm">New Assignment: {visitType}</strong>
                      </div>
                      <p className="text-xs text-slate-650 mt-1">
                        You have been assigned to <span className="font-semibold text-slate-900">{o.companyName}</span> ({o.city}) for {visitType.toLowerCase()}.
                        {o.deliveryDate && ` Scheduled: ${new Date(o.deliveryDate).toLocaleString()}`}
                      </p>
                    </div>
                    <Button 
                      onClick={() => dismissOrderAlert(o.id, 'engineer_assign')}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs px-3 py-1.5 rounded-xl shrink-0"
                    >
                      Acknowledge Task
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {/* Active Job Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                <Wrench size={16} className="text-[#173c2d]" />
                <span>My Assigned Service Tickets & Visits</span>
              </h3>
              
              <div className="flex items-center gap-2">
                {/* View All Toggle */}
                <button
                  onClick={() => setShowAllTickets(!showAllTickets)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                    showAllTickets 
                      ? "bg-[#173c2d] text-white border-[#173c2d]" 
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {showAllTickets ? "Showing All" : "View All"}
                </button>

                {/* Sort Toggle */}
                <button
                  onClick={() => setTicketSort(ticketSort === "default" ? "date-early" : "default")}
                  className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                    ticketSort === "date-early"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                  title="Sort: Date Early First"
                >
                  <ArrowUpDown size={14} />
                  <span>Sort Date Early First</span>
                  {ticketSort === "date-early" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  )}
                </button>
              </div>
            </div>

            {myServiceTickets.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8 bg-slate-50 border rounded-xl">
                No active service checkups, complaints, or commissioning jobs assigned to you.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myServiceTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/orders?orderId=${ticket.orderId}`)}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[#173c2d] uppercase tracking-wider">{ticket.type}</span>
                        <span className={`font-semibold px-2 py-0.5 rounded border text-[10px] ${
                          ticket.type === "Commissioning" 
                            ? "bg-sky-50 text-sky-700 border-sky-100" 
                            : ticket.type === "Order Delivery"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : ticket.type === "Check-up"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : ticket.type === "Main Service"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                            : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}>{ticket.status}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{ticket.companyName}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={11} /> {ticket.city}</p>
                      {ticket.date && (
                        <p className="text-[10px] text-slate-450 mt-1 flex items-center gap-1 font-semibold text-slate-500">
                          <Clock size={10} /> Scheduled: {new Date(ticket.date).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {ticket.details && (
                      <p className="text-[11px] text-slate-650 bg-white border p-2 rounded italic text-slate-600 line-clamp-3">
                        "{ticket.details}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
