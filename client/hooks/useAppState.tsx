import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// Types definition
export type UserRole = "Owner" | "Sales Person" | "Receptionist" | "Service Engineer";

export interface LeadProduct {
  productId: string;
  productName: string;
  quantity: number;
  invoiceAmount: number;
}

export interface Lead {
  id: string;
  company: string;
  contact?: string;
  phone: string;
  salesperson: string;
  address: string;
  city: string;
  branch: string;
  status: "New" | "In Quotation" | "In Discussion" | "Win" | "Lost" | "Disqualified" | "Converted";
  substatus?: string;
  convertedAt?: string;
  statusReason?: string; // reason for Lost, Disqualified, Unavailable
  followUpDate?: string; // for Postponed / Follow-up Needed
  notes: Note[];
  quotations?: Quotation[];
  productsSelected?: LeadProduct[];
  gstNumber?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationRequest {
  id: string;
  leadId?: string;
  orderId?: string;
  requestedTypes: string[];
  notes?: string;
  photo?: string;
  voiceNote?: string;
  requestedBy: string;
  requestedAt: string;
  resolved: boolean;
}

export interface Note {
  id: string;
  text: string;
  photo?: string; // base64 or placeholder url
  voiceNote?: string; // duration representation or simulated audio path
  timestamp: string;
  user: string;
}

export interface Order {
  id: string;
  leadId?: string;
  customerId: string;
  companyName: string;
  salesperson: string;
  city: string;
  branch: string;
  status: "Payment Pending" | "Order Placed with Supplier" | "Commissioning Pending" | "Commissioned/Completed";
  commissionedDate?: string;
  assignedEngineer?: string;
  supplierId?: string;
  deliveryPartner?: string;
  deliveryDate?: string;
  ownerRescheduleAlert?: boolean;
  engineerRescheduleAlert?: boolean;
  engineerAssignAlert?: boolean;
  quotations: Quotation[];
  productsSelected?: LeadProduct[];
  orderValue?: number;
  gstNumber?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  fileName: string;
  fileSize: string;
  type: "Technical" | "Bank" | "Service";
  uploadedBy: string;
  uploadedAt: string;
  approved: boolean; // visual-only approval flag
}

export interface BranchDetail {
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
}

export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  city?: string;
  address?: string;
  branches?: string[];
  branchDetails?: BranchDetail[];
  gstNumber?: string;
}

export interface Complaint {
  id: string;
  orderId: string;
  companyName: string;
  city: string;
  issue: string;
  status: "Open" | "Assigned" | "In Progress" | "Resolved/Closed" | "Reopened";
  photo?: string;
  voiceNote?: string;
  assignedEngineer?: string;
  assignedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Part {
  id: string;
  name: string;
  quantity: number;
  threshold: number;
}

export interface PaymentEntry {
  id: string;
  orderId: string;
  amount: number;
  date: string;
  note: string;
}

export interface PaymentLedger {
  orderId: string;
  entries: PaymentEntry[];
  isComplete: boolean;
}

export interface ServiceCycle {
  orderId: string;
  companyName: string;
  commissionedDate: string;
  // Track A: 45-Day Checkup
  lastCheckupDate?: string;
  nextCheckupDate: string;
  checkupReports: ServiceReport[];
  // Track B: 2000-Hour Major Service
  lastMajorServiceDate?: string;
  nextMajorServiceDate?: string; // calculated from hour meter rate or default 180 days
  currentHourMeter: number;
  lastHourMeter: number;
  preServiceReports: ServiceReport[];
  postServiceReports: ServiceReport[];
  serviceQuotations: Quotation[];
  assignedCheckupEngineer?: string;
  assignedMajorEngineer?: string;
}

export interface ServiceReport {
  id: string;
  fileName: string;
  type: "Checkup" | "Pre-Service" | "Post-Service";
  uploadedAt: string;
  uploadedBy: string;
  serviceEngineer?: string;
}

export interface TimelineLog {
  id: string;
  orderId: string;
  action: string;
  user: string;
  timestamp: string;
}

export interface Visit {
  id: string;
  visitType?: 'Sales' | 'Delivery' | 'Commissioning' | 'Service';
  serviceType?: 'Checkup' | 'Major';
  companyName: string;
  contactPerson?: string;
  phone?: string;
  city?: string;
  address?: string;
  branch?: string;
  orderId?: string;
  supplierId?: string;
  productsSelected?: LeadProduct[];
  salesperson?: string;
  status: 'Pending' | 'Started' | 'In communication' | 'Unavailable' | 'Postponed' | 'Disqualified' | 'Convert to lead' | 'Lost' | 'Completed' | 'Issue Found';
  scheduledAt?: string;
  startTime?: string;
  startLocation?: { lat: number; lng: number };
  startedBy?: string;
  followUpDate?: string;
  reason?: string;
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

// Master types
export interface ProductMaster { id: string; name: string; model?: string; hp?: number; price?: number; }
export interface PartsMaster { id: string; name: string; price: number; threshold?: number; }
export interface SupplierMaster { id: string; name: string; contact?: string; city?: string; }
export interface EmployeeMaster {
  name: string;
  initials?: string;
  role?: UserRole | "";
  contact?: string;
  city?: string;
  tone?: string;
  permissions?: Record<string, { read: boolean; write: boolean }>;
}

interface AppContextType {
  loading: boolean;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  currentSimulatedUser: string;
  setCurrentSimulatedUser: (name: string) => void;
  leads: Lead[];
  orders: Order[];
  customers: Customer[];
  complaints: Complaint[];
  inventory: Part[];
  payments: PaymentLedger[];
  serviceCycles: ServiceCycle[];
  timelineLogs: TimelineLog[];
  visits: Visit[];
  quotationRequests: QuotationRequest[];
  // Masters
  products: ProductMaster[];
  partsMaster: PartsMaster[];
  suppliers: SupplierMaster[];
  employees: EmployeeMaster[];
  cities: string[];

  // Actions
  addLead: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt" | "notes" | "productsSelected"> & { productsSelected?: LeadProduct[], reason?: string, followUpDate?: string, createdAt?: string, gstNumber?: string, convertedAt?: string, substatus?: string }) => Promise<void>;
  updateLead: (id: string, updates: {
    company?: string;
    contact?: string;
    phone?: string;
    salesperson?: string;
    city?: string;
    branch?: string;
    address?: string;
    gstNumber?: string;
    productsSelected?: LeadProduct[];
    createdAt?: string;
  }) => Promise<void>;
  updateLeadStatus: (id: string, status: Lead["status"], reason?: string, followUpDate?: string, substatus?: string) => Promise<void>;
  addNoteToLead: (leadId: string, noteText: string, photo?: string, voiceNote?: string) => Promise<void>;
  addOrder: (order: Omit<Order, "createdAt" | "updatedAt" | "quotations">) => Promise<void>;
  updateOrderStatus: (id: string, status: Order["status"], assignedEngineer?: string) => Promise<void>;
  updateOrderValue: (orderId: string, newValue: number) => Promise<void>;
  updateOrderDetails: (id: string, updates: {
    companyName?: string;
    salesperson?: string;
    city?: string;
    branch?: string;
    supplierId?: string | null;
    deliveryPartner?: string | null;
    assignedEngineer?: string | null;
    status?: Order["status"];
    orderValue?: number;
    gstNumber?: string | null;
    deliveryDate?: string | null;
    skipVisitCreation?: boolean;
  }) => Promise<void>;
  dismissOrderAlert: (orderId: string, alertType: "owner_reschedule" | "engineer_reschedule" | "engineer_assign") => Promise<void>;
  uploadQuotation: (parentId: string, type: Quotation["type"], file: File, isLead?: boolean) => Promise<void>;
  toggleQuotationApproval: (parentId: string, quotationId: string) => Promise<void>;
  deleteQuotation: (parentId: string, quotationId: string) => Promise<void>;
  addNoteToOrder: (orderId: string, noteText: string, photo?: string, voiceNote?: string) => Promise<void>;
  logComplaint: (orderId: string, issue: string, photo?: string, voiceNote?: string) => Promise<void>;
  assignComplaint: (complaintId: string, engineerName: string) => Promise<void>;
  updateComplaintStatus: (complaintId: string, status: Complaint["status"]) => Promise<void>;
  addInventoryStock: (partId: string, qty: number) => Promise<void>;
  addPayment: (orderId: string, amount: number, note: string) => Promise<void>;
  togglePaymentComplete: (orderId: string) => Promise<void>;
  completeServiceCheckup: (orderId: string, reportName: string, serviceEngineer: string) => Promise<void>;
  completeMajorService: (orderId: string, preReportName: string, postReportName: string, partsUsed: { partId: string; qty: number }[], serviceEngineer: string) => Promise<void>;
  uploadServiceQuotation: (orderId: string, fileName: string) => Promise<void>;
  uploadServiceReport: (orderId: string, type: "Checkup" | "Pre-Service" | "Post-Service", file: File) => Promise<void>;
  deleteServiceReport: (orderId: string, reportId: string) => Promise<void>;
  addQuotationRequest: (req: Omit<QuotationRequest, "id" | "requestedAt" | "resolved" | "requestedBy">) => Promise<void>;
  resolveQuotationRequest: (requestId: string) => Promise<void>;
  assignServiceTrackEngineer: (orderId: string, track: "Checkup" | "Major", engineerName: string | null) => Promise<void>;
  logTimeline: (orderId: string, action: string) => Promise<void>;

  addVisit: (visitData: Omit<Visit, "id" | "createdAt" | "updatedAt" | "notes" | "status"> & { notesText?: string }) => Promise<void>;
  startVisit: (id: string) => Promise<void>;
  logVisit: (id: string, outcomeData: { status: Visit["status"]; notesText?: string; photo?: string; voiceNote?: string; followUpDate?: string; reason?: string }) => Promise<void>;
  updateVisitStatus: (id: string, status: Visit["status"], outcomeData?: { notesText?: string; photo?: string; voiceNote?: string; followUpDate?: string; reason?: string }) => Promise<void>;
  updateVisit: (id: string, updates: Partial<Omit<Visit, "id" | "createdAt" | "updatedAt" | "notes" | "status">>) => Promise<void>;
  addNoteToVisit: (visitId: string, noteText: string, photo?: string, voiceNote?: string) => Promise<void>;

  hasReadPermission: (moduleName: string) => boolean;
  hasWritePermission: (moduleName: string) => boolean;

  // Master Mutations
  saveProductMaster: (data: ProductMaster) => Promise<void>;
  deleteProductMaster: (id: string) => Promise<void>;
  savePartsMaster: (data: PartsMaster) => Promise<void>;
  deletePartsMaster: (id: string) => Promise<void>;
  saveSupplierMaster: (data: SupplierMaster) => Promise<void>;
  deleteSupplierMaster: (id: string) => Promise<void>;
  saveEmployeeMaster: (data: EmployeeMaster) => Promise<void>;
  deleteEmployeeMaster: (name: string) => Promise<void>;
  saveCustomerMaster: (data: Customer) => Promise<void>;
  deleteCustomerMaster: (id: string) => Promise<void>;
  addCityMaster: (name: string) => Promise<void>;
  deleteCityMaster: (name: string) => Promise<void>;
}

const AppStateContext = createContext<AppContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [currentSimulatedUser, setCurrentSimulatedUser] = useState<string>(() => {
    return localStorage.getItem("nexair_simulated_user") || "Owner";
  });
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem("nexair_role") as UserRole) || "Owner";
  });

  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [inventory, setInventory] = useState<Part[]>([]);
  const [payments, setPayments] = useState<PaymentLedger[]>([]);
  const [serviceCycles, setServiceCycles] = useState<ServiceCycle[]>([]);
  const [timelineLogs, setTimelineLogs] = useState<TimelineLog[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([]);

  // Masters
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [partsMaster, setPartsMaster] = useState<PartsMaster[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierMaster[]>([]);
  const [employees, setEmployees] = useState<EmployeeMaster[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Save role and simulated user state locally
  useEffect(() => {
    localStorage.setItem("nexair_simulated_user", currentSimulatedUser);
    if (currentSimulatedUser === "Owner") {
      setCurrentUserRole("Owner");
    } else {
      const emp = employees.find(e => e.name === currentSimulatedUser);
      if (emp && emp.role) {
        setCurrentUserRole(emp.role as UserRole);
      }
    }
  }, [currentSimulatedUser, employees]);

  useEffect(() => {
    localStorage.setItem("nexair_role", currentUserRole);
  }, [currentUserRole]);

  // Synchronize with database
  const refreshData = async () => {
    try {
      const [
        { data: dbCities, error: errCities },
        { data: dbEmployees, error: errEmployees },
        { data: dbSuppliers, error: errSuppliers },
        { data: dbPartsMaster, error: errPartsMaster },
        { data: dbProductMaster, error: errProductMaster },
        { data: dbInventory, error: errInventory },
        { data: dbCustomers, error: errCustomers },
        { data: dbLeads, error: errLeads },
        { data: dbNotes, error: errNotes },
        { data: dbOrders, error: errOrders },
        { data: dbQuotations, error: errQuotations },
        { data: dbComplaints, error: errComplaints },
        { data: dbLedgers, error: errLedgers },
        { data: dbPayEntries, error: errPayEntries },
        { data: dbServiceCycles, error: errServiceCycles },
        { data: dbServiceReports, error: errServiceReports },
        { data: dbTimelineLogs, error: errTimelineLogs },
        { data: dbVisits, error: errVisits },
        { data: dbQuotationRequests, error: errQuotationRequests }
      ] = await Promise.all([
        supabase.from("cities").select("*"),
        supabase.from("employee_master").select("*"),
        supabase.from("supplier_master").select("*"),
        supabase.from("parts_master").select("*"),
        supabase.from("product_master").select("*"),
        supabase.from("inventory").select("*"),
        supabase.from("customers").select("*"),
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("notes").select("*").order("timestamp", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("quotations").select("*"),
        supabase.from("complaints").select("*").order("created_at", { ascending: false }),
        supabase.from("payment_ledgers").select("*"),
        supabase.from("payment_entries").select("*").order("date", { ascending: true }),
        supabase.from("service_cycles").select("*"),
        supabase.from("service_reports").select("*"),
        supabase.from("timeline_logs").select("*").order("timestamp", { ascending: false }),
        supabase.from("visits").select("*").order("created_at", { ascending: false }),
        supabase.from("quotation_requests").select("*").order("requested_at", { ascending: false })
      ]);

      if (
        errCities || errEmployees || errSuppliers || errPartsMaster || 
        errProductMaster || errInventory || errCustomers || errLeads || 
        errNotes || errOrders || errQuotations || errComplaints || 
        errLedgers || errPayEntries || errServiceCycles || errServiceReports || 
        errTimelineLogs || errVisits || errQuotationRequests
      ) {
        console.error("Error loading data from Supabase:", {
          errCities, errEmployees, errSuppliers, errPartsMaster, errProductMaster,
          errInventory, errCustomers, errLeads, errNotes, errOrders, errQuotations,
          errComplaints, errLedgers, errPayEntries, errServiceCycles, errServiceReports,
          errTimelineLogs, errVisits, errQuotationRequests
        });
        return;
      }

      if (dbCities) setCities(dbCities.map((c: any) => c.name));
      if (dbEmployees) setEmployees(dbEmployees as EmployeeMaster[]);
      if (dbSuppliers) setSuppliers(dbSuppliers as SupplierMaster[]);
      if (dbPartsMaster) setPartsMaster(dbPartsMaster as PartsMaster[]);
      if (dbProductMaster) setProducts(dbProductMaster as ProductMaster[]);
      if (dbInventory) setInventory(dbInventory as Part[]);
      if (dbCustomers) setCustomers(dbCustomers.map((c: any) => ({ ...c, contactPerson: c.contact_person, branchDetails: c.branch_details, gstNumber: c.gst_number })) as Customer[]);

      if (dbQuotationRequests) {
        setQuotationRequests(dbQuotationRequests.map((q: any) => ({
          id: q.id,
          leadId: q.lead_id || undefined,
          orderId: q.order_id || undefined,
          requestedTypes: q.requested_types || [],
          notes: q.notes || undefined,
          photo: q.photo || undefined,
          voiceNote: q.voice_note || undefined,
          requestedBy: q.requested_by,
          requestedAt: q.requested_at,
          resolved: q.resolved
        })));
      }

      // Map notes to leads
      if (dbLeads && dbNotes) {
        const mappedLeads: Lead[] = dbLeads.map((l: any) => {
          const leadNotes = dbNotes
            .filter((n: any) => n.lead_id === l.id)
            .map((n: any) => ({
              id: n.id,
              text: n.text,
              photo: n.photo || undefined,
              voiceNote: n.voice_note || undefined,
              timestamp: n.timestamp,
              user: n.username
            }));
          return {
            id: l.id,
            company: l.company,
            contact: l.contact || undefined,
            phone: l.phone,
            salesperson: l.salesperson,
            address: l.address,
            city: l.city,
            branch: l.branch || "Main",
            status: l.status,
            substatus: l.substatus || undefined,
            convertedAt: l.converted_at || undefined,
            statusReason: l.status_reason || undefined,
            followUpDate: l.follow_up_date || undefined,
            notes: leadNotes,
            quotations: dbQuotations
              ? dbQuotations.filter((q: any) => q.lead_id === l.id).map((q: any) => ({
                  id: q.id,
                  fileName: q.file_name,
                  fileSize: q.file_size,
                  type: q.type,
                  uploadedBy: q.uploaded_by,
                  uploadedAt: q.uploaded_at,
                  approved: q.approved
                }))
              : [],
            productsSelected: l.products_selected || [],
            gstNumber: l.gst_number || undefined,
            createdBy: l.created_by || undefined,
            createdAt: l.created_at,
            updatedAt: l.updated_at
          };
        });
        setLeads(mappedLeads);
      }

      // Map quotations & notes to orders
      if (dbOrders && dbQuotations && dbNotes) {
        const mappedOrders: Order[] = dbOrders.map((o: any) => {
          const orderQuos = dbQuotations
            .filter((q: any) => q.order_id === o.id)
            .map((q: any) => ({
              id: q.id,
              fileName: q.file_name,
              fileSize: q.file_size,
              type: q.type,
              uploadedBy: q.uploaded_by,
              uploadedAt: q.uploaded_at,
              approved: q.approved
            }));
          return {
            id: o.id,
            leadId: o.lead_id || undefined,
            customerId: o.customer_id,
            companyName: o.company_name,
            salesperson: o.salesperson,
            city: o.city,
            branch: o.branch || "Main",
            status: o.status,
            commissionedDate: o.commissioned_date || undefined,
            assignedEngineer: o.assigned_engineer || undefined,
            supplierId: o.supplier_id || undefined,
            deliveryPartner: o.delivery_partner || undefined,
            deliveryDate: o.delivery_date || undefined,
            ownerRescheduleAlert: !!o.owner_reschedule_alert,
            engineerRescheduleAlert: !!o.engineer_reschedule_alert,
            engineerAssignAlert: !!o.engineer_assign_alert,
            quotations: orderQuos,
            productsSelected: o.products_selected || [],
            orderValue: o.order_value ? Number(o.order_value) : 0,
            gstNumber: o.gst_number || undefined,
            createdBy: o.created_by || undefined,
            createdAt: o.created_at,
            updatedAt: o.updated_at
          };
        });
        setOrders(mappedOrders);
      }

      // Map complaints
      if (dbComplaints) {
        setComplaints(dbComplaints.map((c: any) => ({
          id: c.id,
          orderId: c.order_id,
          companyName: c.company_name,
          city: c.city,
          issue: c.issue,
          status: c.status,
          assignedEngineer: c.assigned_engineer || undefined,
          assignedAt: c.assigned_at || undefined,
          resolvedAt: c.resolved_at || undefined,
          resolvedBy: c.resolved_by || undefined,
          createdBy: c.created_by || undefined,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        })));
      }

      // Map payment ledgers
      if (dbLedgers && dbPayEntries) {
        const mappedPayments: PaymentLedger[] = dbLedgers.map((l: any) => {
          const entries = dbPayEntries
            .filter((e: any) => e.order_id === l.order_id)
            .map((e: any) => ({
              id: e.id,
              orderId: e.order_id,
              amount: Number(e.amount),
              date: e.date,
              note: e.note
            }));
          return {
            orderId: l.order_id,
            entries,
            isComplete: l.is_complete
          };
        });
        setPayments(mappedPayments);
      }

      // Map service cycles
      if (dbServiceCycles && dbServiceReports && dbQuotations) {
        const mappedCycles: ServiceCycle[] = dbServiceCycles.map((c: any) => {
          const reports = dbServiceReports.filter((r: any) => r.order_id === c.order_id);
          const checkupReports = reports
            .filter((r: any) => r.type === "Checkup")
            .map((r: any) => ({ id: r.id, fileName: r.file_name, type: "Checkup" as const, uploadedAt: r.uploaded_at, uploadedBy: r.uploaded_by, serviceEngineer: r.service_engineer }));
          const preServiceReports = reports
            .filter((r: any) => r.type === "Pre-Service")
            .map((r: any) => ({ id: r.id, fileName: r.file_name, type: "Pre-Service" as const, uploadedAt: r.uploaded_at, uploadedBy: r.uploaded_by, serviceEngineer: r.service_engineer }));
          const postServiceReports = reports
            .filter((r: any) => r.type === "Post-Service")
            .map((r: any) => ({ id: r.id, fileName: r.file_name, type: "Post-Service" as const, uploadedAt: r.uploaded_at, uploadedBy: r.uploaded_by, serviceEngineer: r.service_engineer }));

          const serviceQuotations = dbQuotations
            .filter((q: any) => q.order_id === c.order_id && q.type === "Service")
            .map((q: any) => ({
              id: q.id,
              fileName: q.file_name,
              fileSize: q.file_size,
              type: q.type,
              uploadedBy: q.uploaded_by,
              uploadedAt: q.uploaded_at,
              approved: q.approved
            }));

          return {
            orderId: c.order_id,
            companyName: c.company_name,
            commissionedDate: c.commissioned_date,
            lastCheckupDate: c.last_checkup_date || undefined,
            nextCheckupDate: c.next_checkup_date,
            checkupReports,
            lastMajorServiceDate: c.last_major_service_date || undefined,
            nextMajorServiceDate: c.next_major_service_date || undefined,
            currentHourMeter: c.current_hour_meter,
            lastHourMeter: c.last_hour_meter,
            preServiceReports,
            postServiceReports,
            serviceQuotations,
            assignedCheckupEngineer: c.assigned_checkup_engineer || undefined,
            assignedMajorEngineer: c.assigned_major_engineer || undefined
          };
        });
        setServiceCycles(mappedCycles);
      }

      // Map timeline logs
      if (dbTimelineLogs) {
        setTimelineLogs(dbTimelineLogs.map((l: any) => ({
          id: l.id,
          orderId: l.order_id,
          action: l.action,
          user: l.username,
          timestamp: l.timestamp
        })));
      }

      // Map visits
      if (dbVisits && dbNotes) {
        const mappedVisits: Visit[] = dbVisits.map((v: any) => {
          const visitNotes = dbNotes
            .filter((n: any) => n.visit_id === v.id)
            .map((n: any) => ({
              id: n.id,
              text: n.text,
              photo: n.photo || undefined,
              voiceNote: n.voice_note || undefined,
              timestamp: n.timestamp,
              user: n.username
            }));
          return {
            id: v.id,
            visitType: v.visit_type || 'Sales',
            serviceType: v.service_type || undefined,
            companyName: v.company_name,
            contactPerson: v.contact_person || undefined,
            phone: v.phone || undefined,
            city: v.city || undefined,
            address: v.address || undefined,
            branch: v.branch || undefined,
            orderId: v.order_id || undefined,
            productsSelected: v.products_selected || [],
            salesperson: v.salesperson || undefined,
            status: v.status,
            scheduledAt: v.scheduled_at || undefined,
            startTime: v.start_time || undefined,
            startLocation: v.start_location || undefined,
            supplierId: v.supplier_id || undefined,
            startedBy: v.started_by || undefined,
            followUpDate: v.follow_up_date || undefined,
            reason: v.reason || undefined,
            notes: visitNotes,
            createdAt: v.created_at,
            updatedAt: v.updated_at
          };
        });
        setVisits(mappedVisits);
      }
    } catch (err) {
      console.error("Failed to load live data from Supabase:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    init();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        (payload) => {
          console.log('Realtime DB change received:', payload);
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Logger helper in database
  const logTimelineInDb = async (orderId: string, action: string) => {
    await supabase.from("timeline_logs").insert({
      id: `log-${Date.now()}`,
      order_id: orderId,
      action,
      username: currentUserRole === "Owner" ? "Karan Desai (Owner)" : currentUserRole
    });
  };

  const logTimeline = async (orderId: string, action: string) => {
    await logTimelineInDb(orderId, action);
    await refreshData();
  };

  // 1. Add Lead
  const addLead = async (leadData: Omit<Lead, "id" | "createdAt" | "updatedAt" | "notes" | "productsSelected"> & { productsSelected?: LeadProduct[], reason?: string, followUpDate?: string, createdAt?: string, gstNumber?: string, convertedAt?: string, substatus?: string }) => {
    const leadId = `L-${Date.now()}`;
    const { error } = await supabase.from("leads").insert({
      id: leadId,
      company: leadData.company,
      contact: leadData.contact || null,
      phone: leadData.phone || null,
      salesperson: leadData.salesperson || null,
      address: leadData.address || null,
      city: leadData.city || null,
      branch: leadData.branch,
      status: leadData.status,
      substatus: leadData.substatus || null,
      products_selected: leadData.productsSelected || [],
      created_by: currentSimulatedUser,
      created_at: leadData.createdAt || new Date().toISOString(),
      converted_at: leadData.convertedAt || null,
      status_reason: leadData.reason || null,
      follow_up_date: leadData.followUpDate || null,
      gst_number: leadData.gstNumber || null
    });
    if (error) {
      console.error("Error creating lead:", error);
      alert("Error creating lead: " + error.message);
    }

    // Reflect branch in customer master if customer already exists
    const customer = customers.find(c => c.name.toLowerCase() === leadData.company.toLowerCase());
    if (customer) {
      const currentBranches = customer.branches || [];
      if (!currentBranches.includes(leadData.branch)) {
        const newBranches = [...currentBranches, leadData.branch];
        await supabase.from("customers").update({
          branches: newBranches
        }).eq("id", customer.id);
      }
    }

    await refreshData();
  };

  const updateLead = async (id: string, updates: {
    company?: string;
    contact?: string;
    phone?: string;
    salesperson?: string;
    city?: string;
    branch?: string;
    address?: string;
    productsSelected?: LeadProduct[];
    createdAt?: string;
    gstNumber?: string;
  }) => {
    const dbUpdates: any = {};
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.contact !== undefined) dbUpdates.contact = updates.contact;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.salesperson !== undefined) dbUpdates.salesperson = updates.salesperson;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.branch !== undefined) dbUpdates.branch = updates.branch;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.productsSelected !== undefined) dbUpdates.products_selected = updates.productsSelected;
    if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;
    if (updates.gstNumber !== undefined) dbUpdates.gst_number = updates.gstNumber;
    
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase.from("leads").update(dbUpdates).eq("id", id);
    if (error) {
      console.error("Error updating lead:", error);
      alert("Error updating lead: " + error.message);
    }
    await refreshData();
  };

  // 2. Update Lead Status
  const updateLeadStatus = async (id: string, status: Lead["status"], reason?: string, followUpDate?: string, substatus?: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    if (status === "Win") {
      // Find or create customer
      let customer = customers.find(c => c.name.toLowerCase() === lead.company.toLowerCase());
      let customerId = customer?.id;
      if (!customer) {
        customerId = `C-${Date.now()}`;
        const { error: custErr } = await supabase.from("customers").insert({
          id: customerId,
          name: lead.company,
          contact_person: lead.contact || null,
          phone: lead.phone || null,
          city: lead.city || null,
          address: lead.address || null,
          branches: [lead.branch],
          gst_number: lead.gstNumber || null
        });
        if (custErr) {
          console.error("Error creating customer from lead:", custErr);
          alert("Error creating customer from lead: " + custErr.message);
        }
      } else {
        const currentBranches = customer.branches || [];
        if (!currentBranches.includes(lead.branch)) {
          const newBranches = [...currentBranches, lead.branch];
          await supabase.from("customers").update({
            branches: newBranches
          }).eq("id", customer.id);
        }
      }
 
      // Create order
      const orderId = `ORD-${Date.now()}`;
      const orderValue = (lead.productsSelected || []).reduce((sum, p) => sum + (p.invoiceAmount * p.quantity), 0);
      const { error: ordErr } = await supabase.from("orders").insert({
        id: orderId,
        lead_id: lead.id,
        customer_id: customerId,
        company_name: lead.company,
        salesperson: lead.salesperson || null,
        city: lead.city || null,
        branch: lead.branch,
        status: "Payment Pending",
        products_selected: lead.productsSelected || [],
        order_value: orderValue,
        gst_number: lead.gstNumber || null,
        created_by: currentSimulatedUser
      });
      if (ordErr) console.error("Error creating order:", ordErr);

      // Create payment ledger
      await supabase.from("payment_ledgers").insert({
        order_id: orderId,
        is_complete: false
      });

      // Link lead's quotations to the new order
      const { error: quoErr } = await supabase.from("quotations").update({
        order_id: orderId
      }).eq("lead_id", id);
      if (quoErr) console.error("Error linking quotations to order:", quoErr);

      // Update lead to Converted
      const { error: leadErr } = await supabase.from("leads").update({
        status: "Converted",
        updated_at: new Date().toISOString()
      }).eq("id", id);
      if (leadErr) console.error("Error updating lead status:", leadErr);

      // Log timeline
      await logTimelineInDb(orderId, `Order created from Converted Lead ${lead.id}`);
    } else {
      const { error } = await supabase.from("leads").update({
        status,
        substatus: substatus || null,
        status_reason: reason || null,
        follow_up_date: followUpDate || null,
        updated_at: new Date().toISOString()
      }).eq("id", id);
      if (error) {
        console.error("Error updating lead status:", error);
        alert("Error updating lead status: " + error.message);
      }
    }
    await refreshData();
  };

  // 2b. Add Quotation Request
  const addQuotationRequest = async (req: Omit<QuotationRequest, "id" | "requestedAt" | "resolved" | "requestedBy">) => {
    const { error } = await supabase.from("quotation_requests").insert({
      id: `qr-${Date.now()}`,
      lead_id: req.leadId || null,
      order_id: req.orderId || null,
      requested_types: req.requestedTypes,
      notes: req.notes || null,
      photo: req.photo || null,
      voice_note: req.voiceNote || null,
      requested_by: currentSimulatedUser,
      requested_at: new Date().toISOString(),
      resolved: false
    });
    if (error) {
      console.error("Error creating quotation request:", error);
      alert("Error requesting quotation: " + error.message);
    }
    await refreshData();
  };

  // 2c. Resolve Quotation Request
  const resolveQuotationRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("quotation_requests")
      .update({ resolved: true })
      .eq("id", requestId);
    if (error) {
      console.error("Error resolving quotation request:", error);
    }
    await refreshData();
  };

  // 3. Add Note to Lead
  const addNoteToLead = async (leadId: string, noteText: string, photo?: string, voiceNote?: string) => {
    await supabase.from("notes").insert({
      id: `n-${Date.now()}`,
      lead_id: leadId,
      text: noteText,
      photo: photo || null,
      voice_note: voiceNote || null,
      username: currentUserRole === "Owner" ? "Karan Desai (Owner)" : currentUserRole
    });
    await refreshData();
  };

  // 4. Add Order
  const addOrder = async (orderData: Omit<Order, "createdAt" | "updatedAt" | "quotations" | "productsSelected" | "orderValue"> & { productsSelected?: LeadProduct[], orderValue?: number, gstNumber?: string }) => {
    await supabase.from("orders").insert({
      id: orderData.id,
      lead_id: orderData.leadId || null,
      customer_id: orderData.customerId,
      company_name: orderData.companyName,
      salesperson: orderData.salesperson,
      city: orderData.city,
      branch: orderData.branch,
      status: "Payment Pending",
      products_selected: orderData.productsSelected || [],
      order_value: orderData.orderValue || 0,
      gst_number: orderData.gstNumber || null,
      created_by: currentSimulatedUser
    });

    const customer = customers.find(c => c.id === orderData.customerId || c.name.toLowerCase() === orderData.companyName.toLowerCase());
    if (customer) {
      const currentBranches = customer.branches || [];
      if (!currentBranches.includes(orderData.branch)) {
        const newBranches = [...currentBranches, orderData.branch];
        await supabase.from("customers").update({
          branches: newBranches
        }).eq("id", customer.id);
      }
    } else {
      const customerId = orderData.customerId || `C-${Date.now()}`;
      await supabase.from("customers").insert({
        id: customerId,
        name: orderData.companyName,
        city: orderData.city,
        branches: [orderData.branch],
        gst_number: orderData.gstNumber || null
      });
    }
 
    await supabase.from("payment_ledgers").insert({
      order_id: orderData.id,
      is_complete: false
    });

    await logTimelineInDb(orderData.id, `Order created manually`);
    await refreshData();
  };

  // 5. Update Order Status
  const updateOrderStatus = async (id: string, status: Order["status"], assignedEngineer?: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const prevStatus = order.status;

    const payload: any = { 
      status, 
      updated_at: new Date().toISOString(),
      commissioned_date: status === "Commissioned/Completed" ? new Date().toISOString() : order.commissionedDate 
    };
    if (assignedEngineer) {
      payload.assigned_engineer = assignedEngineer;
    }

    if (currentUserRole === "Service Engineer") {
      if (order.deliveryPartner === currentSimulatedUser) {
        payload.delivery_partner = null;
      }
      if (order.assignedEngineer === currentSimulatedUser) {
        payload.assigned_engineer = null;
      }
    }

    const { error } = await supabase.from("orders").update(payload).eq("id", id);
    if (error) {
      console.error("Error updating order status:", error);
      alert("Error updating order status: " + error.message);
      return;
    }

    let logMsg = `Status changed from "${prevStatus}" to "${status}"`;
    if (assignedEngineer) logMsg += ` (Assigned to: ${assignedEngineer})`;
    
    await logTimelineInDb(id, logMsg);

    if (status === "Commissioned/Completed" && prevStatus !== "Commissioned/Completed") {
      const serviceCycleExists = serviceCycles.some(sc => sc.orderId === id);
      if (!serviceCycleExists) {
        const commDate = new Date().toISOString();
        const nextCheckup = new Date();
        nextCheckup.setDate(nextCheckup.getDate() + 45);

        const nextMajor = new Date();
        nextMajor.setDate(nextMajor.getDate() + 80);

        await supabase.from("service_cycles").insert({
          order_id: id,
          company_name: order.companyName,
          commissioned_date: commDate,
          next_checkup_date: nextCheckup.toISOString().split('T')[0],
          next_major_service_date: nextMajor.toISOString().split('T')[0],
          current_hour_meter: 0,
          last_hour_meter: 0
        });

        await logTimelineInDb(id, `Commissioned: Service Cycles initialized (45-Day Checkup and 2000-Hour Tracks starting from Day 0)`);
      }
    }
    await refreshData();
  };

  // 6. Upload Quotation
  const uploadQuotation = async (parentId: string, type: Quotation["type"], file: File, isLead: boolean = false) => {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    const fileId = `q-${Date.now()}`;
    
    const payload: any = {
      id: fileId,
      file_name: file.name,
      file_size: sizeInMB,
      type,
      uploaded_by: currentUserRole === "Owner" ? "Karan Desai (Owner)" : currentUserRole,
      approved: false
    };

    if (isLead) {
      payload.lead_id = parentId;
    } else {
      payload.order_id = parentId;
    }

    await supabase.from("quotations").insert(payload);
    
    if (!isLead) {
      await logTimelineInDb(parentId, `${type} Quotation "${file.name}" uploaded`);
    }
    await refreshData();
  };

  // Update Order Value (For Owner)
  const updateOrderValue = async (orderId: string, newValue: number) => {
    await supabase.from("orders").update({
      order_value: newValue,
      updated_at: new Date().toISOString()
    }).eq("id", orderId);
    
    const ledger = payments.find(p => p.orderId === orderId);
    if (ledger) {
      const totalPaid = ledger.entries.reduce((sum, e) => sum + e.amount, 0);
      const isNowComplete = totalPaid >= newValue;
      await supabase.from("payment_ledgers").update({
        is_complete: isNowComplete
      }).eq("order_id", orderId);
      
      if (isNowComplete !== ledger.isComplete) {
         await logTimelineInDb(orderId, `Payment status automatically updated to ${isNowComplete ? 'Complete' : 'Pending'} due to order value change`);
      }
    }

    await logTimelineInDb(orderId, `Order Value manually updated to ₹${newValue.toLocaleString()}`);
    await refreshData();
  };
  
  // Update all details of an order (For Owner)
  const updateOrderDetails = async (id: string, updates: {
    companyName?: string;
    salesperson?: string;
    city?: string;
    branch?: string;
    supplierId?: string | null;
    deliveryPartner?: string | null;
    assignedEngineer?: string | null;
    status?: Order["status"];
    orderValue?: number;
    gstNumber?: string | null;
    deliveryDate?: string | null;
    skipVisitCreation?: boolean;
  }) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.companyName !== undefined) payload.company_name = updates.companyName;
    if (updates.salesperson !== undefined) payload.salesperson = updates.salesperson;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.branch !== undefined) payload.branch = updates.branch;
    if (updates.supplierId !== undefined) payload.supplier_id = updates.supplierId;
    
    if (updates.deliveryPartner !== undefined) {
      payload.delivery_partner = updates.deliveryPartner;
      if (updates.deliveryPartner !== (order.deliveryPartner || null) && updates.deliveryPartner !== null && !updates.skipVisitCreation) {
        payload.engineer_assign_alert = true;
        
        // Auto-create a Delivery visit when delivery partner is assigned
        const visitId = `V-${Date.now()}`;
        const customerName = updates.companyName || order.companyName;
        const customerObj = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
        const newVisit = {
          id: visitId,
          visit_type: 'Delivery',
          company_name: customerName,
          contact_person: customerObj?.contactPerson || null,
          phone: customerObj?.phone || null,
          city: updates.city || order.city || null,
          branch: updates.branch || order.branch || null,
          order_id: id,
          supplier_id: updates.supplierId !== undefined ? updates.supplierId : (order.supplierId || null),
          products_selected: order.productsSelected || [],
          salesperson: updates.deliveryPartner,
          status: 'Pending',
          scheduled_at: updates.deliveryDate || order.deliveryDate || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        // Run insert asynchronously to avoid blocking
        supabase.from("visits").insert(newVisit).then(({ error }) => {
          if (error) console.error("Error auto-creating delivery visit:", error);
        });
      }
    }
    
    if (updates.assignedEngineer !== undefined) {
      payload.assigned_engineer = updates.assignedEngineer;
      if (updates.assignedEngineer !== (order.assignedEngineer || null) && updates.assignedEngineer !== null && !updates.skipVisitCreation) {
        payload.engineer_assign_alert = true;

        // Auto-create a Commissioning visit when assigned engineer is assigned
        const visitId = `V-${Date.now()}`;
        const customerName = updates.companyName || order.companyName;
        const customerObj = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
        const newVisit = {
          id: visitId,
          visit_type: 'Commissioning',
          company_name: customerName,
          contact_person: customerObj?.contactPerson || null,
          phone: customerObj?.phone || null,
          city: updates.city || order.city || null,
          branch: updates.branch || order.branch || null,
          order_id: id,
          products_selected: order.productsSelected || [],
          salesperson: updates.assignedEngineer,
          status: 'Pending',
          scheduled_at: updates.deliveryDate || order.deliveryDate || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        // Run insert asynchronously to avoid blocking
        supabase.from("visits").insert(newVisit).then(({ error }) => {
          if (error) console.error("Error auto-creating commissioning visit:", error);
        });
      } else if (updates.assignedEngineer !== (order.assignedEngineer || null) && updates.assignedEngineer !== null) {
        payload.engineer_assign_alert = true;
      }
    }
    
    if (updates.deliveryDate !== undefined) {
      payload.delivery_date = updates.deliveryDate;
      const cleanNewDate = updates.deliveryDate ? new Date(updates.deliveryDate).toISOString() : null;
      const cleanOldDate = order.deliveryDate ? new Date(order.deliveryDate).toISOString() : null;
      if (cleanNewDate !== cleanOldDate) {
        if (currentUserRole === "Owner") {
          payload.engineer_reschedule_alert = true;
          payload.owner_reschedule_alert = false;
        } else if (currentUserRole === "Service Engineer") {
          payload.owner_reschedule_alert = true;
          payload.engineer_reschedule_alert = false;
        }
      }
    }
    
    if (updates.status !== undefined) {
      payload.status = updates.status;
      if (updates.status === "Commissioned/Completed") {
        payload.commissioned_date = new Date().toISOString();
      }
    }
    if (updates.orderValue !== undefined) payload.order_value = updates.orderValue;
    if (updates.gstNumber !== undefined) payload.gst_number = updates.gstNumber;

    const { error } = await supabase.from("orders").update(payload).eq("id", id);
    if (error) {
      console.error("Error updating order details:", error);
      alert("Error updating order details: " + error.message);
      return;
    }

    let changes = [];
    if (updates.companyName) changes.push(`Company Name to "${updates.companyName}"`);
    if (updates.salesperson) changes.push(`Salesperson to "${updates.salesperson}"`);
    if (updates.city) changes.push(`City to "${updates.city}"`);
    if (updates.branch) changes.push(`Branch to "${updates.branch}"`);
    if (updates.supplierId) {
      const sup = suppliers.find(s => s.id === updates.supplierId);
      changes.push(`Supplier to "${sup ? sup.name : updates.supplierId}"`);
    } else if (updates.supplierId === null) {
      changes.push(`Supplier cleared`);
    }
    if (updates.deliveryPartner) changes.push(`Delivery Partner to "${updates.deliveryPartner}"`);
    else if (updates.deliveryPartner === null) changes.push(`Delivery Partner cleared`);
    
    if (updates.assignedEngineer) changes.push(`Service Engineer to "${updates.assignedEngineer}"`);
    else if (updates.assignedEngineer === null) changes.push(`Service Engineer cleared`);
    
    if (updates.deliveryDate) changes.push(`Delivery Date to "${updates.deliveryDate}"`);
    else if (updates.deliveryDate === null) changes.push(`Delivery Date cleared`);

    if (updates.status) changes.push(`Status to "${updates.status}"`);
    if (updates.orderValue !== undefined) changes.push(`Order Value to ₹${updates.orderValue}`);
    if (updates.gstNumber !== undefined) changes.push(`GST Number updated`);

    if (changes.length > 0) {
      await logTimelineInDb(id, `Order details updated: ${changes.join(", ")}`);
    }

    // Auto service cycles
    if (updates.status === "Commissioned/Completed" && order.status !== "Commissioned/Completed") {
      const serviceCycleExists = serviceCycles.some(sc => sc.orderId === id);
      if (!serviceCycleExists) {
        const commDate = new Date().toISOString();
        const nextCheckup = new Date();
        nextCheckup.setDate(nextCheckup.getDate() + 45);

        const nextMajor = new Date();
        nextMajor.setDate(nextMajor.getDate() + 80);

        await supabase.from("service_cycles").insert({
          order_id: id,
          company_name: updates.companyName || order.companyName,
          commissioned_date: commDate,
          next_checkup_date: nextCheckup.toISOString().split('T')[0],
          next_major_service_date: nextMajor.toISOString().split('T')[0],
          current_hour_meter: 0,
          last_hour_meter: 0
        });

        await logTimelineInDb(id, `Commissioned: Service Cycles initialized (45-Day Checkup and 2000-Hour Tracks starting from Day 0)`);
      }
    }

    // Recalculate payment completion if orderValue changed
    if (updates.orderValue !== undefined) {
      const ledger = payments.find(p => p.orderId === id);
      if (ledger) {
        const totalPaid = ledger.entries.reduce((sum, e) => sum + e.amount, 0);
        const isNowComplete = totalPaid >= updates.orderValue;
        await supabase.from("payment_ledgers").update({
          is_complete: isNowComplete
        }).eq("order_id", id);
      }
    }

    await refreshData();
  };

  const dismissOrderAlert = async (orderId: string, alertType: "owner_reschedule" | "engineer_reschedule" | "engineer_assign") => {
    const payload: any = {};
    if (alertType === "owner_reschedule") payload.owner_reschedule_alert = false;
    if (alertType === "engineer_reschedule") payload.engineer_reschedule_alert = false;
    if (alertType === "engineer_assign") payload.engineer_assign_alert = false;

    const { error } = await supabase.from("orders").update(payload).eq("id", orderId);
    if (error) {
      console.error("Error dismissing order alert:", error);
      return;
    }
    await refreshData();
  };

  // 7. Toggle Quotation Approval
  const toggleQuotationApproval = async (parentId: string, quotationId: string) => {
    const order = orders.find(o => o.id === parentId);
    const lead = leads.find(l => l.id === parentId);

    let quo;
    if (order) quo = order.quotations.find(q => q.id === quotationId);
    else if (lead) quo = (lead.quotations || []).find(q => q.id === quotationId);

    if (!quo) return;

    const approvedState = !quo.approved;
    await supabase.from("quotations").update({
      approved: approvedState
    }).eq("id", quotationId);

    if (order) {
      await logTimelineInDb(parentId, `Quotation "${quo.fileName}" approval flag toggled to: ${approvedState ? "Approved" : "Pending"}`);
    } else if (lead) {
      await supabase.from("notes").insert({
        id: `n-${Date.now()}`,
        parent_id: parentId,
        parent_type: 'lead',
        text: `Quotation "${quo.fileName}" approval flag toggled to: ${approvedState ? "Approved" : "Pending"}`,
        user_name: currentSimulatedUser
      });
    }
    await refreshData();
  };

  // 8. Delete Quotation
  const deleteQuotation = async (parentId: string, quotationId: string) => {
    const order = orders.find(o => o.id === parentId);
    const lead = leads.find(l => l.id === parentId);
    
    let fileName = "Document";
    if (order) {
      const quo = order.quotations.find(q => q.id === quotationId);
      if (quo) fileName = quo.fileName;
    } else if (lead) {
      const quo = (lead.quotations || []).find(q => q.id === quotationId);
      if (quo) fileName = quo.fileName;
    }

    await supabase.from("quotations").delete().eq("id", quotationId);
    if (order) {
      await logTimelineInDb(parentId, `Quotation "${fileName}" deleted`);
    }
    await refreshData();
  };

  // 9. Add note to Order
  const addNoteToOrder = async (orderId: string, noteText: string, photo?: string, voiceNote?: string) => {
    await supabase.from("notes").insert({
      id: `n-${Date.now()}`,
      order_id: orderId,
      text: noteText,
      photo: photo || null,
      voice_note: voiceNote || null,
      username: currentUserRole === "Owner" ? "Karan Desai (Owner)" : currentUserRole
    });

    let logMsg = `Added Note: "${noteText}"`;
    if (photo) logMsg += " [Attached Photo]";
    if (voiceNote) logMsg += " [Attached Audio]";
    await logTimelineInDb(orderId, logMsg);
    await refreshData();
  };

  // 10. Log Complaint
  const logComplaint = async (orderId: string, issue: string, photo?: string, voiceNote?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const compId = `COMP-${Date.now()}`;
    await supabase.from("complaints").insert({
      id: compId,
      order_id: orderId,
      company_name: order.companyName,
      city: order.city,
      issue,
      status: "Open",
      photo: photo || null,
      voice_note: voiceNote || null,
      created_by: currentSimulatedUser
    });

    let msg = `Complaint logged: "${issue}" (Ticket ID: ${compId})`;
    if (photo) msg += " [Attached Photo]";
    if (voiceNote) msg += " [Attached Audio]";
    await logTimelineInDb(orderId, msg);
    await refreshData();
  };

  // 11. Assign Complaint
  const assignComplaint = async (complaintId: string, engineerName: string) => {
    const comp = complaints.find(c => c.id === complaintId);
    if (!comp) return;

    await supabase.from("complaints").update({
      status: "Assigned",
      assigned_engineer: engineerName,
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq("id", complaintId);

    await logTimelineInDb(comp.orderId, `Complaint ${comp.id} assigned to engineer: ${engineerName}`);
    await refreshData();
  };

  // 12. Update Complaint Status
  const updateComplaintStatus = async (complaintId: string, status: Complaint["status"]) => {
    const comp = complaints.find(c => c.id === complaintId);
    if (!comp) return;

    const isClosing = status === "Resolved/Closed";
    await supabase.from("complaints").update({
      status,
      resolved_at: isClosing ? new Date().toISOString() : null,
      resolved_by: isClosing ? (currentUserRole === "Owner" ? "Karan Desai (Owner)" : currentUserRole) : null,
      updated_at: new Date().toISOString()
    }).eq("id", complaintId);

    await logTimelineInDb(comp.orderId, `Complaint ${comp.id} status changed to ${status}`);
    await refreshData();
  };

  // 13. Add Inventory Stock
  const addInventoryStock = async (partId: string, qty: number) => {
    const p = inventory.find(i => i.id === partId);
    if (!p) return;

    await supabase.from("inventory").update({
      quantity: p.quantity + qty
    }).eq("id", partId);
    await refreshData();
  };

  // 14. Add Payment Log Entry
  const addPayment = async (orderId: string, amount: number, note: string) => {
    await supabase.from("payment_entries").insert({
      id: `pay-${Date.now()}`,
      order_id: orderId,
      amount,
      note
    });

    const order = orders.find(o => o.id === orderId);
    const ledger = payments.find(p => p.orderId === orderId);
    
    if (order && ledger) {
      const newTotalPaid = ledger.entries.reduce((sum, e) => sum + e.amount, 0) + amount;
      const orderValue = order.orderValue || 0;
      const isNowComplete = newTotalPaid >= orderValue;
      
      await supabase.from("payment_ledgers").update({
        is_complete: isNowComplete
      }).eq("order_id", orderId);
      
      if (isNowComplete !== ledger.isComplete) {
         await logTimelineInDb(orderId, `Payment status automatically updated to ${isNowComplete ? 'Complete' : 'Pending'}`);
      }
    }

    await logTimelineInDb(orderId, `Payment of ₹${amount.toLocaleString()} logged: "${note}"`);
    await refreshData();
  };

  // 15. Toggle Payment Complete Override
  const togglePaymentComplete = async (orderId: string) => {
    const ledger = payments.find(p => p.orderId === orderId);
    if (!ledger) return;

    const newState = !ledger.isComplete;
    await supabase.from("payment_ledgers").update({
      is_complete: newState
    }).eq("order_id", orderId);

    await logTimelineInDb(orderId, `Payment status overridden: Marked as ${newState ? 'Complete' : 'Incomplete'}`);
    await refreshData();
  };

  // 16. Complete Service Checkup (Track A)
  const completeServiceCheckup = async (orderId: string, reportName: string, serviceEngineer: string) => {
    const nextCheckup = new Date();
    nextCheckup.setDate(nextCheckup.getDate() + 45);

    await supabase.from("service_reports").insert({
      id: `rep-${Date.now()}`,
      order_id: orderId,
      file_name: reportName,
      type: "Checkup",
      uploaded_by: currentUserRole === "Owner" ? "Karan Desai (Owner)" : currentUserRole,
      service_engineer: serviceEngineer
    });

    await supabase.from("service_cycles").update({
      last_checkup_date: new Date().toISOString().split('T')[0],
      next_checkup_date: nextCheckup.toISOString().split('T')[0],
      assigned_checkup_engineer: null
    }).eq("order_id", orderId);

    await logTimelineInDb(orderId, `45-Day Checkup Service completed. Report: "${reportName}" uploaded. Next checkup scheduled for ${nextCheckup.toLocaleDateString()}`);
    await refreshData();
  };

  // 17. Complete Major Service (Track B)
  const completeMajorService = async (
    orderId: string,
    preReportName: string,
    postReportName: string,
    partsUsed: { partId: string; qty: number }[],
    serviceEngineer: string
  ) => {
    const timeNow = new Date().toISOString();
    const userName = currentUserRole === "Owner" ? "Karan Desai (Owner)" : currentUserRole;

    await supabase.from("service_reports").insert([
      { id: `rep-pre-${Date.now()}`, order_id: orderId, file_name: preReportName, type: "Pre-Service", uploaded_by: userName, service_engineer: serviceEngineer },
      { id: `rep-post-${Date.now()}`, order_id: orderId, file_name: postReportName, type: "Post-Service", uploaded_by: userName, service_engineer: serviceEngineer }
    ]);

    // decrement inventory parts
    for (const part of partsUsed) {
      const invPart = inventory.find(i => i.id === part.partId);
      if (invPart) {
        const newQty = Math.max(0, invPart.quantity - part.qty);
        await supabase.from("inventory").update({ quantity: newQty }).eq("id", part.partId);
      }
    }

    const nextMajor = new Date();
    nextMajor.setDate(nextMajor.getDate() + 80);
    const nextCheckup = new Date();
    nextCheckup.setDate(nextCheckup.getDate() + 45);

    const sc = serviceCycles.find(s => s.orderId === orderId);
    const prevHourMeter = sc?.currentHourMeter || 0;
    const newHourMeter = prevHourMeter + 2000;

    await supabase.from("service_cycles").update({
      last_major_service_date: timeNow.split('T')[0],
      next_major_service_date: nextMajor.toISOString().split('T')[0],
      last_hour_meter: prevHourMeter,
      current_hour_meter: newHourMeter,
      last_checkup_date: timeNow.split('T')[0],
      next_checkup_date: nextCheckup.toISOString().split('T')[0],
      assigned_major_engineer: null
    }).eq("order_id", orderId);

    await logTimelineInDb(
      orderId,
      `2000-Hour Major Service completed. Hour Meter automatically incremented to ${newHourMeter} hrs (prev: ${prevHourMeter} hrs). Parts deducted: ${partsUsed.map(p => {
        const partObj = inventory.find(i => i.id === p.partId);
        return `${partObj?.name || p.partId} (x${p.qty})`;
      }).join(", ")}. Pre-report: "${preReportName}", Post-report: "${postReportName}". This also resets the 45-day checkup countdown.`
    );
    await refreshData();
  };

  // 18. Upload Service Quotation
  const uploadServiceQuotation = async (orderId: string, fileName: string) => {
    await supabase.from("quotations").insert({
      id: `q-srv-${Date.now()}`,
      order_id: orderId,
      file_name: fileName,
      file_size: "750 KB",
      type: "Service",
      uploaded_by: currentUserRole === "Owner" ? "Karan Desai (Owner)" : currentUserRole,
      approved: false
    });

    await logTimelineInDb(orderId, `Service Quotation "${fileName}" uploaded for parts/repairs`);
    await refreshData();
  };

  // 19. Upload Service Report (Direct)
  const uploadServiceReport = async (orderId: string, type: "Checkup" | "Pre-Service" | "Post-Service", file: File) => {
    const fileId = `rep-${Date.now()}`;
    const userName = currentUserRole === "Owner" ? "Karan Desai (Owner)" : currentUserRole;
    await supabase.from("service_reports").insert({
      id: fileId,
      order_id: orderId,
      file_name: file.name,
      type,
      uploaded_by: userName,
      service_engineer: currentSimulatedUser
    });
    
    await logTimelineInDb(orderId, `${type} Report "${file.name}" uploaded`);
    await refreshData();
  };

  // 20. Delete Service Report
  const deleteServiceReport = async (orderId: string, reportId: string) => {
    await supabase.from("service_reports").delete().eq("id", reportId);
    await logTimelineInDb(orderId, `Service Report deleted`);
    await refreshData();
  };

  // 21. Assign Service Track Engineer (Checkup or Major)
  const assignServiceTrackEngineer = async (orderId: string, track: "Checkup" | "Major", engineerName: string | null) => {
    const field = track === "Checkup" ? "assigned_checkup_engineer" : "assigned_major_engineer";
    await supabase.from("service_cycles").update({
      [field]: engineerName
    }).eq("order_id", orderId);
    
    await logTimelineInDb(orderId, `${track} Service Engineer assigned to: ${engineerName || 'None'}`);
    await refreshData();
  };

  const saveProductMaster = async (data: ProductMaster) => {
    const hpVal = data.hp !== undefined && data.hp !== null && !isNaN(Number(data.hp)) ? Number(data.hp) : null;
    const priceVal = data.price !== undefined && data.price !== null && !isNaN(Number(data.price)) ? Number(data.price) : null;
    
    const { error } = await supabase.from("product_master").upsert({
      id: data.id,
      name: data.name,
      model: data.model || null,
      hp: hpVal,
      price: priceVal
    });
    if (error) {
      console.error("Error saving product master:", error);
      alert("Error saving product: " + error.message);
    }
    await refreshData();
  };

  const deleteProductMaster = async (id: string) => {
    const { error } = await supabase.from("product_master").delete().eq("id", id);
    if (error) {
      console.error("Error deleting product master:", error);
      alert("Error deleting product: " + error.message);
    }
    await refreshData();
  };

  const savePartsMaster = async (data: PartsMaster) => {
    const { error } = await supabase.from("parts_master").upsert({
      id: data.id,
      name: data.name,
      price: data.price,
      threshold: data.threshold ?? 3
    });
    if (error) {
      console.error("Error saving spare part master:", error);
      alert("Error saving spare part: " + error.message);
      return;
    }
    const { data: existingInv } = await supabase.from("inventory").select("id").eq("id", data.id);
    if (!existingInv || existingInv.length === 0) {
      await supabase.from("inventory").insert({
        id: data.id,
        name: data.name,
        quantity: 0,
        threshold: data.threshold ?? 3
      });
    } else {
      await supabase.from("inventory").update({
        threshold: data.threshold ?? 3
      }).eq("id", data.id);
    }
    await refreshData();
  };

  const deletePartsMaster = async (id: string) => {
    const { error: err1 } = await supabase.from("parts_master").delete().eq("id", id);
    const { error: err2 } = await supabase.from("inventory").delete().eq("id", id);
    if (err1 || err2) {
      console.error("Error deleting spare part:", err1 || err2);
      alert("Error deleting spare part: " + (err1?.message || err2?.message));
    }
    await refreshData();
  };

  const saveSupplierMaster = async (data: SupplierMaster) => {
    const { error } = await supabase.from("supplier_master").upsert({
      id: data.id,
      name: data.name,
      contact: data.contact || null,
      city: data.city || null
    });
    if (error) {
      console.error("Error saving supplier master:", error);
      alert("Error saving supplier: " + error.message);
    }
    await refreshData();
  };

  const deleteSupplierMaster = async (id: string) => {
    const { error } = await supabase.from("supplier_master").delete().eq("id", id);
    if (error) {
      console.error("Error deleting supplier:", error);
      alert("Error deleting supplier: " + error.message);
    }
    await refreshData();
  };

  const saveEmployeeMaster = async (data: EmployeeMaster) => {
    const { error } = await supabase.from("employee_master").upsert({
      name: data.name,
      initials: data.initials || null,
      role: data.role || null,
      contact: data.contact || null,
      city: data.city || null,
      tone: data.tone || "bg-teal-100 text-teal-800",
      permissions: data.permissions || {}
    });
    if (error) {
      console.error("Error saving employee master:", error);
      alert("Error saving employee: " + error.message);
    }
    await refreshData();
  };

  const deleteEmployeeMaster = async (name: string) => {
    const { error } = await supabase.from("employee_master").delete().eq("name", name);
    if (error) {
      console.error("Error deleting employee:", error);
      alert("Error deleting employee: " + error.message);
    }
    await refreshData();
  };

  const saveCustomerMaster = async (data: Customer) => {
    const { error } = await supabase.from("customers").upsert({
      id: data.id,
      name: data.name,
      contact_person: data.contactPerson || null,
      phone: data.phone || null,
      city: data.city || null,
      address: data.address || null,
      branches: data.branches || [],
      branch_details: data.branchDetails || [],
      gst_number: data.gstNumber || null
    });
    if (error) {
      console.error("Error saving customer master:", error);
      alert("Error saving customer: " + error.message);
    }
    await refreshData();
  };

  const deleteCustomerMaster = async (id: string) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      console.error("Error deleting customer:", error);
      alert("Error deleting customer: " + error.message);
    }
    await refreshData();
  };

  const addCityMaster = async (name: string) => {
    const { error } = await supabase.from("cities").insert({ name });
    if (error) {
      console.error("Error adding city:", error);
      alert("Error adding city: " + error.message);
    }
    await refreshData();
  };

  const deleteCityMaster = async (name: string) => {
    const { error } = await supabase.from("cities").delete().eq("name", name);
    if (error) {
      console.error("Error deleting city:", error);
      alert("Error deleting city: " + error.message);
    }
    await refreshData();
  };

  const addVisit = async (visitData: Omit<Visit, "id" | "createdAt" | "updatedAt" | "notes" | "status"> & { notesText?: string }) => {
    const visitId = `V-${Date.now()}`;
    const { error } = await supabase.from("visits").insert({
      id: visitId,
      visit_type: visitData.visitType || 'Sales',
      service_type: visitData.serviceType || null,
      company_name: visitData.companyName,
      contact_person: visitData.contactPerson || null,
      phone: visitData.phone || null,
      city: visitData.city || null,
      address: visitData.address || null,
      branch: visitData.branch || null,
      order_id: visitData.orderId || null,
      supplier_id: visitData.supplierId || null,
      products_selected: visitData.productsSelected || [],
      salesperson: visitData.salesperson || currentSimulatedUser,
      status: 'Pending',
      scheduled_at: visitData.scheduledAt || null
    });
    if (error) {
      console.error("Error creating visit:", error);
      alert("Error creating visit: " + error.message);
      return;
    }

    if (visitData.notesText?.trim() || (visitData as any).notesPhoto || (visitData as any).notesVoice) {
      await addNoteToVisit(visitId, visitData.notesText?.trim() || "Initial Visit Log", (visitData as any).notesPhoto, (visitData as any).notesVoice);
    }

    if (visitData.visitType === 'Sales' && visitData.branch) {
      const customer = customers.find(c => c.name.toLowerCase() === visitData.companyName.toLowerCase());
      if (customer) {
        let changed = false;
        const newBranchDetails = [...(customer.branchDetails || [])];
        const bIndex = newBranchDetails.findIndex(b => b.name === visitData.branch);
        
        if (bIndex > -1) {
          const existing = newBranchDetails[bIndex];
          if (visitData.contactPerson && existing.contactPerson !== visitData.contactPerson) {
             existing.contactPerson = visitData.contactPerson;
             changed = true;
          }
          if (visitData.phone && existing.phone !== visitData.phone) {
             existing.phone = visitData.phone;
             changed = true;
          }
          if (visitData.address && existing.address !== visitData.address) {
             existing.address = visitData.address;
             changed = true;
          }
        } else {
          newBranchDetails.push({
            name: visitData.branch,
            contactPerson: visitData.contactPerson,
            phone: visitData.phone,
            address: visitData.address
          });
          changed = true;
        }

        const newBranches = [...(customer.branches || [])];
        if (!newBranches.includes(visitData.branch)) {
           newBranches.push(visitData.branch);
           changed = true;
        }

        if (changed) {
          await supabase.from("customers").update({
            branch_details: newBranchDetails,
            branches: newBranches
          }).eq("id", customer.id);
        }
      }
    }

    await refreshData();
  };

  const startVisit = async (id: string) => {
    let location: any = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (e) {
      console.warn("Could not retrieve geolocation:", e);
    }

    const { error } = await supabase
      .from("visits")
      .update({
        status: 'Started',
        start_time: new Date().toISOString(),
        start_location: location,
        started_by: currentSimulatedUser,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      console.error("Error starting visit:", error);
      alert("Error starting visit: " + error.message);
    }
    await refreshData();
  };

  const logVisit = async (id: string, outcomeData: { status: Visit["status"]; notesText?: string; photo?: string; voiceNote?: string; followUpDate?: string; reason?: string }) => {
    const { error } = await supabase
      .from("visits")
      .update({
        status: outcomeData.status,
        follow_up_date: outcomeData.followUpDate || null,
        reason: outcomeData.reason || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      console.error("Error logging outcome:", error);
      alert("Error logging outcome: " + error.message);
      return;
    }

    if (outcomeData.notesText?.trim()) {
      await addNoteToVisit(id, outcomeData.notesText.trim(), outcomeData.photo, outcomeData.voiceNote);
    }

    if (outcomeData.status === "Convert to lead") {
      const visit = visits.find(v => v.id === id);
      if (visit) {
        await addLead({
          company: visit.companyName,
          contact: visit.contactPerson,
          phone: visit.phone || "",
          salesperson: visit.salesperson || currentSimulatedUser,
          address: visit.address || "",
          city: visit.city || "Ahmedabad",
          branch: visit.branch || "Main",
          status: "New",
          productsSelected: visit.productsSelected || [],
          reason: outcomeData.reason || undefined,
          followUpDate: outcomeData.followUpDate || undefined
        });
      }
    }

    await refreshData();
  };

  const updateVisitStatus = async (id: string, status: Visit["status"], outcomeData?: { notesText?: string; photo?: string; voiceNote?: string; followUpDate?: string; reason?: string }) => {
    const { error } = await supabase
      .from("visits")
      .update({
        status: status,
        follow_up_date: outcomeData?.followUpDate || null,
        reason: outcomeData?.reason || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + error.message);
      return;
    }

    if (outcomeData?.notesText?.trim()) {
      await addNoteToVisit(id, outcomeData.notesText.trim(), outcomeData.photo, outcomeData.voiceNote);
    }

    if (status === "Convert to lead") {
      const visit = visits.find(v => v.id === id);
      if (visit) {
        await addLead({
          company: visit.companyName,
          contact: visit.contactPerson,
          phone: visit.phone || "",
          salesperson: visit.salesperson || currentSimulatedUser,
          address: visit.address || "",
          city: visit.city || "Ahmedabad",
          branch: visit.branch || "Main",
          status: "New",
          productsSelected: visit.productsSelected || [],
          reason: outcomeData?.reason || undefined,
          followUpDate: outcomeData?.followUpDate || undefined
        });
      }
    }

    await refreshData();
  };

  const updateVisit = async (id: string, updates: Partial<Omit<Visit, "id" | "createdAt" | "updatedAt" | "notes" | "status">>) => {
    const dbUpdates: any = {};
    if (updates.visitType !== undefined) dbUpdates.visit_type = updates.visitType;
    if (updates.serviceType !== undefined) dbUpdates.service_type = updates.serviceType;
    if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
    if (updates.contactPerson !== undefined) dbUpdates.contact_person = updates.contactPerson;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.branch !== undefined) dbUpdates.branch = updates.branch;
    if (updates.orderId !== undefined) dbUpdates.order_id = updates.orderId;
    if (updates.productsSelected !== undefined) dbUpdates.products_selected = updates.productsSelected;
    if (updates.salesperson !== undefined) dbUpdates.salesperson = updates.salesperson;
    if (updates.scheduledAt !== undefined) dbUpdates.scheduled_at = updates.scheduledAt;
    if (updates.supplierId !== undefined) dbUpdates.supplier_id = updates.supplierId;

    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase.from("visits").update(dbUpdates).eq("id", id);
    if (error) {
      console.error("Error updating visit:", error);
      alert("Error updating visit: " + error.message);
    }
    await refreshData();
  };

  const addNoteToVisit = async (visitId: string, noteText: string, photo?: string, voiceNote?: string) => {
    await supabase.from("notes").insert({
      id: `n-${Date.now()}`,
      visit_id: visitId,
      text: noteText,
      photo: photo || null,
      voice_note: voiceNote || null,
      username: currentUserRole === "Owner" ? "Karan Desai (Owner)" : currentUserRole
    });
    await refreshData();
  };

  const hasReadPermission = (moduleName: string): boolean => {
    if (moduleName === "Visits") return true;
    if (currentSimulatedUser === "Owner") return true;
    const emp = employees.find(e => e.name === currentSimulatedUser);
    if (!emp) return false;
    if (!emp.permissions) return false;
    if (moduleName === "Customers" && emp.permissions["Customers"] === undefined) {
      return emp.permissions["Masters"]?.read ?? false;
    }
    return emp.permissions[moduleName]?.read ?? false;
  };

  const hasWritePermission = (moduleName: string): boolean => {
    if (moduleName === "Visits") return true;
    if (currentSimulatedUser === "Owner") return true;
    const emp = employees.find(e => e.name === currentSimulatedUser);
    if (!emp) return false;
    if (!emp.permissions) return false;
    if (moduleName === "Customers" && emp.permissions["Customers"] === undefined) {
      return emp.permissions["Masters"]?.write ?? false;
    }
    return emp.permissions[moduleName]?.write ?? false;
  };

  const visibleLeads = React.useMemo(() => {
    const activeLeads = leads.filter(l => l.status !== "Converted");
    if (currentSimulatedUser === "Owner") return activeLeads;
    const emp = employees.find(e => e.name === currentSimulatedUser);
    if (!emp) return activeLeads;
    if (emp.role === "Sales Person") {
      return activeLeads.filter(l => l.salesperson === currentSimulatedUser || l.createdBy === currentSimulatedUser);
    }
    return activeLeads;
  }, [leads, currentSimulatedUser, employees]);

  const visibleOrders = React.useMemo(() => {
    if (currentSimulatedUser === "Owner") return orders;
    const emp = employees.find(e => e.name === currentSimulatedUser);
    if (!emp) {
      return orders.filter(o => o.assignedEngineer === currentSimulatedUser || o.deliveryPartner === currentSimulatedUser);
    }
    if (emp.role === "Sales Person") {
      return orders.filter(o => o.salesperson === currentSimulatedUser || o.createdBy === currentSimulatedUser || o.assignedEngineer === currentSimulatedUser || o.deliveryPartner === currentSimulatedUser);
    }
    if (emp.role === "Service Engineer") {
      return orders.filter(o => o.assignedEngineer === currentSimulatedUser || o.deliveryPartner === currentSimulatedUser || o.createdBy === currentSimulatedUser);
    }
    return orders;
  }, [orders, currentSimulatedUser, employees]);

  const visibleComplaints = React.useMemo(() => {
    if (currentSimulatedUser === "Owner") return complaints;
    const emp = employees.find(e => e.name === currentSimulatedUser);
    if (!emp) return complaints;
    if (emp.role === "Service Engineer") {
      return complaints.filter(c => c.assignedEngineer === currentSimulatedUser || c.createdBy === currentSimulatedUser);
    }
    if (emp.role === "Sales Person") {
      return complaints.filter(c => c.createdBy === currentSimulatedUser);
    }
    return complaints;
  }, [complaints, currentSimulatedUser, employees]);

  const visibleServiceCycles = React.useMemo(() => {
    if (currentSimulatedUser === "Owner") return serviceCycles;
    const emp = employees.find(e => e.name === currentSimulatedUser);
    if (!emp) return serviceCycles;
    if (emp.role === "Service Engineer") {
      return serviceCycles.filter(sc => 
        sc.assignedCheckupEngineer === currentSimulatedUser || 
        sc.assignedMajorEngineer === currentSimulatedUser
      );
    }
    return serviceCycles;
  }, [serviceCycles, currentSimulatedUser, employees]);

  const visiblePayments = React.useMemo(() => {
    if (currentSimulatedUser === "Owner") return payments;
    const emp = employees.find(e => e.name === currentSimulatedUser);
    if (!emp) return payments;
    if (emp.role === "Sales Person") {
      return payments.filter(p => {
        const orderObj = orders.find(o => o.id === p.orderId);
        return orderObj?.salesperson === currentSimulatedUser || orderObj?.createdBy === currentSimulatedUser;
      });
    }
    if (emp.role === "Service Engineer") {
      return payments.filter(p => {
        const orderObj = orders.find(o => o.id === p.orderId);
        return orderObj?.assignedEngineer === currentSimulatedUser || orderObj?.createdBy === currentSimulatedUser;
      });
    }
    return payments;
  }, [payments, orders, currentSimulatedUser, employees]);

  const visibleTimelineLogs = React.useMemo(() => {
    if (currentSimulatedUser === "Owner") return timelineLogs;
    const emp = employees.find(e => e.name === currentSimulatedUser);
    if (!emp) return timelineLogs;
    if (emp.role === "Sales Person") {
      return timelineLogs.filter(t => {
        const orderObj = orders.find(o => o.id === t.orderId);
        return orderObj?.salesperson === currentSimulatedUser || orderObj?.createdBy === currentSimulatedUser;
      });
    }
    if (emp.role === "Service Engineer") {
      return timelineLogs.filter(t => {
        const orderObj = orders.find(o => o.id === t.orderId);
        return orderObj?.assignedEngineer === currentSimulatedUser || orderObj?.createdBy === currentSimulatedUser;
      });
    }
    return timelineLogs;
  }, [timelineLogs, orders, currentSimulatedUser, employees]);

  const visibleVisits = React.useMemo(() => {
    const activeVisits = visits.filter(v => v.status !== "Convert to lead");
    if (currentSimulatedUser === "Owner") return activeVisits;
    const emp = employees.find(e => e.name === currentSimulatedUser);
    if (!emp) return activeVisits.filter(v => v.salesperson === currentSimulatedUser);
    if (emp.role === "Sales Person") {
      return activeVisits.filter(v => v.salesperson === currentSimulatedUser);
    }
    return activeVisits;
  }, [visits, currentSimulatedUser, employees]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0e1613] text-white space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <p className="font-display text-sm font-semibold tracking-wider text-emerald-400 uppercase animate-pulse">
          Connecting to NexAir Supabase...
        </p>
      </div>
    );
  }

  return (
    <AppStateContext.Provider value={{
      loading,
      currentUserRole, setCurrentUserRole,
      currentSimulatedUser, setCurrentSimulatedUser,
      leads: visibleLeads,
      orders: visibleOrders,
      customers,
      complaints: visibleComplaints,
      inventory,
      payments: visiblePayments,
      serviceCycles: visibleServiceCycles,
      timelineLogs: visibleTimelineLogs,
      visits: visibleVisits,
      quotationRequests,
      products,
      partsMaster,
      suppliers,
      employees,
      cities,
      addLead, updateLead, updateLeadStatus, addNoteToLead,
      addOrder, updateOrderStatus, updateOrderValue, updateOrderDetails, dismissOrderAlert, uploadQuotation, toggleQuotationApproval, deleteQuotation,
      addNoteToOrder, logComplaint, assignComplaint, updateComplaintStatus,
      addInventoryStock, addPayment, togglePaymentComplete,
      completeServiceCheckup, completeMajorService, uploadServiceQuotation,
      uploadServiceReport, deleteServiceReport, assignServiceTrackEngineer,
      addQuotationRequest, resolveQuotationRequest,
      logTimeline,
      addVisit, startVisit, logVisit, updateVisitStatus, updateVisit, addNoteToVisit,
      saveProductMaster, deleteProductMaster,
      savePartsMaster, deletePartsMaster,
      saveSupplierMaster, deleteSupplierMaster,
      saveEmployeeMaster, deleteEmployeeMaster,
      saveCustomerMaster, deleteCustomerMaster,
      addCityMaster, deleteCityMaster,
      hasReadPermission, hasWritePermission
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
};
