import React, { useState, useMemo } from "react";
import { Search, Plus, Edit3, Settings2, Trash2, ArrowRight, X, Briefcase, Tag, Box, Users, MapPin, Truck, ShieldAlert } from "lucide-react";
import { useAppState, ProductMaster, PartsMaster, SupplierMaster, EmployeeMaster, Customer, UserRole } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type TabType = "products" | "parts" | "suppliers" | "employees" | "customers" | "cities";

const APP_MODULES = ["Dashboard", "Leads", "Orders", "Service", "Complaints", "Inventory", "Ledger", "Masters"] as const;

export const MastersPage: React.FC = () => {
  const {
    products,
    partsMaster,
    suppliers,
    employees,
    customers,
    cities,
    orders,
    complaints,
    saveProductMaster, deleteProductMaster,
    savePartsMaster, deletePartsMaster,
    saveSupplierMaster, deleteSupplierMaster,
    saveEmployeeMaster, deleteEmployeeMaster,
    saveCustomerMaster, deleteCustomerMaster,
    addCityMaster, deleteCityMaster,
    hasWritePermission
  } = useAppState();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("products");
  const [search, setSearch] = useState("");

  const canWrite = hasWritePermission("Masters");

  // Modal open states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [selectedCustDetails, setSelectedCustDetails] = useState<Customer | null>(null);
  const [selectedBranchProfile, setSelectedBranchProfile] = useState<string | null>(null);

  const displayDetails = useMemo(() => {
    if (!selectedCustDetails) return null;
    if (!selectedBranchProfile) return selectedCustDetails;
    
    const bDetail = selectedCustDetails.branchDetails?.find(b => b.name === selectedBranchProfile);
    return {
      ...selectedCustDetails,
      contactPerson: bDetail?.contactPerson || selectedCustDetails.contactPerson,
      phone: bDetail?.phone || selectedCustDetails.phone,
      address: bDetail?.address || selectedCustDetails.address,
    };
  }, [selectedCustDetails, selectedBranchProfile]);

  // --- Dynamic Form States ---
  // Products
  const [prodId, setProdId] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodModel, setProdModel] = useState("");
  const [prodHp, setProdHp] = useState("");
  const [prodPrice, setProdPrice] = useState("");

  // Parts
  const [partId, setPartId] = useState("");
  const [partName, setPartName] = useState("");
  const [partPrice, setPartPrice] = useState("");
  const [partThreshold, setPartThreshold] = useState("3");

  // Suppliers
  const [suppId, setSuppId] = useState("");
  const [suppName, setSuppName] = useState("");
  const [suppContact, setSuppContact] = useState("");
  const [suppCity, setSuppCity] = useState("");

  // Employees
  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState<UserRole | "">("");
  const [empContact, setEmpContact] = useState("");
  const [empCity, setEmpCity] = useState("");
  const [empPermissions, setEmpPermissions] = useState<Record<string, { read: boolean; write: boolean }>>({});

  // Customers
  const [custId, setCustId] = useState("");
  const [custName, setCustName] = useState("");
  const [custContact, setCustContact] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custCity, setCustCity] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custBranches, setCustBranches] = useState("");
  const [custGstNumber, setCustGstNumber] = useState("");

  // Cities
  const [newCityName, setNewCityName] = useState("");

  const getInitials = (name: string) => {
    if (!name) return "";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const resetForms = () => {
    setProdId(""); setProdName(""); setProdModel(""); setProdHp(""); setProdPrice("");
    setPartId(""); setPartName(""); setPartPrice(""); setPartThreshold("3");
    setSuppId(""); setSuppName(""); setSuppContact(""); setSuppCity("");
    setEmpName(""); setEmpRole(""); setEmpContact(""); setEmpCity("");
    setEmpPermissions({});
    setCustId(""); setCustName(""); setCustContact(""); setCustPhone(""); setCustCity(""); setCustAddress("");
    setCustBranches("");
    setCustGstNumber("");
    setNewCityName("");
    setEditingItem(null);
    setIsAddOpen(false);
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    if (activeTab === "products") {
      setProdId(item.id);
      setProdName(item.name);
      setProdModel(item.model || "");
      setProdHp(item.hp !== null && item.hp !== undefined ? item.hp.toString() : "");
      setProdPrice(item.price !== null && item.price !== undefined ? item.price.toString() : "");
    } else if (activeTab === "parts") {
      setPartId(item.id);
      setPartName(item.name);
      setPartPrice(item.price !== null && item.price !== undefined ? item.price.toString() : "");
      setPartThreshold(item.threshold !== null && item.threshold !== undefined ? item.threshold.toString() : "3");
    } else if (activeTab === "suppliers") {
      setSuppId(item.id);
      setSuppName(item.name);
      setSuppContact(item.contact || "");
      setSuppCity(item.city || "");
    } else if (activeTab === "employees") {
      setEmpName(item.name);
      setEmpRole(item.role || "");
      setEmpContact(item.contact || "");
      setEmpCity(item.city || "");
      setEmpPermissions(item.permissions || {});
    } else if (activeTab === "customers") {
      setCustId(item.id);
      setCustName(item.name);
      setCustContact(item.contactPerson || "");
      setCustPhone(item.phone || "");
      setCustCity(item.city || "");
      setCustAddress(item.address || "");
      setCustBranches(item.branches ? item.branches.join(", ") : "");
      setCustGstNumber(item.gstNumber || "");
    }
    setIsAddOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!canWrite) return;
    if (!confirm("Are you sure you want to delete this master record?")) return;
    if (activeTab === "products") {
      await deleteProductMaster(id);
    } else if (activeTab === "parts") {
      await deletePartsMaster(id);
    } else if (activeTab === "suppliers") {
      await deleteSupplierMaster(id);
    } else if (activeTab === "employees") {
      await deleteEmployeeMaster(id);
    } else if (activeTab === "customers") {
      await deleteCustomerMaster(id);
    } else if (activeTab === "cities") {
      await deleteCityMaster(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    if (activeTab === "products") {
      const data: ProductMaster = {
        id: prodId || `P-${Date.now()}`,
        name: prodName,
        model: prodModel || undefined,
        hp: prodHp ? Number(prodHp) : undefined,
        price: prodPrice ? Number(prodPrice) : undefined
      };
      await saveProductMaster(data);
    } else if (activeTab === "parts") {
      const data: PartsMaster = {
        id: partId || `PT-${Date.now()}`,
        name: partName,
        price: Number(partPrice),
        threshold: Number(partThreshold)
      };
      await savePartsMaster(data);
    } else if (activeTab === "suppliers") {
      const data: SupplierMaster = {
        id: suppId || `S-${Date.now()}`,
        name: suppName,
        contact: suppContact || undefined,
        city: suppCity || undefined
      };
      await saveSupplierMaster(data);
    } else if (activeTab === "employees") {
      const data: EmployeeMaster = {
        name: empName,
        initials: getInitials(empName),
        role: empRole || undefined,
        contact: empContact || undefined,
        city: empCity || undefined,
        tone: editingItem?.tone || "bg-teal-100 text-teal-800",
        permissions: empPermissions
      };
      await saveEmployeeMaster(data);
    } else if (activeTab === "customers") {
      const data: Customer = {
        id: custId || `C-${Date.now()}`,
        name: custName,
        contactPerson: custContact || undefined,
        phone: custPhone || undefined,
        city: custCity || undefined,
        address: custAddress || undefined,
        branches: custBranches ? custBranches.split(",").map(b => b.trim()).filter(Boolean) : [],
        gstNumber: custGstNumber || undefined
      };
      await saveCustomerMaster(data);
    } else if (activeTab === "cities") {
      if (newCityName.trim() && !cities.includes(newCityName.trim())) {
        await addCityMaster(newCityName.trim());
      }
    }

    resetForms();
  };

  // Filters data
  const filteredProducts = useMemo(() => products.filter(p => `${p.name} ${p.model}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const filteredParts = useMemo(() => partsMaster.filter(p => p.name.toLowerCase().includes(search.toLowerCase())), [partsMaster, search]);
  const filteredSuppliers = useMemo(() => suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase())), [suppliers, search]);
  const filteredEmployees = useMemo(() => employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase())), [employees, search]);
  const filteredCustomers = useMemo(() => customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase())), [customers, search]);
  const filteredCities = useMemo(() => cities.filter(c => c.toLowerCase().includes(search.toLowerCase())), [cities, search]);

  const tabs = [
    { key: "products", label: "Products", icon: Tag, count: products.length },
    { key: "parts", label: "Spare Parts", icon: Box, count: partsMaster.length },
    { key: "suppliers", label: "Suppliers", icon: Truck, count: suppliers.length },
    { key: "employees", label: "Employees", icon: Briefcase, count: employees.length },
    { key: "cities", label: "Cities", icon: MapPin, count: cities.length },
  ];

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-xs font-semibold text-[#58705c] uppercase tracking-wider">Operational Masters</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#15251f] mt-1">Master Data</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure system lists, product specs, employees roles, spare pricing, and city operations.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setIsAddOpen(true)} className="bg-[#173c2d] hover:bg-[#204a3b] text-white flex items-center gap-2 rounded-xl py-5 shadow-sm">
            <Plus size={16} />
            <span>Add Master Entry</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 scrollbar-none">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key as TabType); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-slate-100 text-slate-600" : "bg-slate-200/60 text-slate-500"}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${activeTab} list...`}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#5b8d65]"
          />
        </div>
      </div>

      {/* Dynamic Data Table / List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {activeTab === "products" && (
                  <>
                    <th className="px-6 py-3.5 hidden sm:table-cell">Product ID</th>
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Model</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">HP Size</th>
                    <th className="px-5 py-3.5">Price</th>
                  </>
                )}
                {activeTab === "parts" && (
                  <>
                    <th className="px-6 py-3.5 hidden sm:table-cell">Part ID</th>
                    <th className="px-5 py-3.5">Part Name</th>
                    <th className="px-5 py-3.5">Retail Price</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">Alert Threshold</th>
                  </>
                )}
                {activeTab === "suppliers" && (
                  <>
                    <th className="px-6 py-3.5 hidden sm:table-cell">Supplier ID</th>
                    <th className="px-5 py-3.5">Supplier Name</th>
                    <th className="px-5 py-3.5">Contact phone</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">Base City</th>
                  </>
                )}
                {activeTab === "employees" && (
                  <>
                    <th className="px-6 py-3.5 hidden sm:table-cell">Tag</th>
                    <th className="px-5 py-3.5">Employee Name</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Contact phone</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">Base City</th>
                    <th className="px-5 py-3.5 hidden md:table-cell">Permissions Summary</th>
                  </>
                )}
                {activeTab === "customers" && (
                  <>
                    <th className="px-6 py-3.5 hidden sm:table-cell">Customer ID</th>
                    <th className="px-5 py-3.5">Company Name</th>
                    <th className="px-5 py-3.5">Contact Person</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">City Location</th>
                  </>
                )}
                {activeTab === "cities" && (
                  <>
                    <th className="px-6 py-3.5">City Name</th>
                    <th className="px-5 py-3.5">State Territory</th>
                  </>
                )}
                {canWrite && <th className="px-5 py-3.5 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Products Render */}
              {activeTab === "products" && filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition text-sm">
                  <td className="px-6 py-4 font-bold text-slate-700 hidden sm:table-cell">{p.id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{p.name}</td>
                  <td className="px-5 py-4 text-slate-600">{p.model}</td>
                  <td className="px-5 py-4 text-slate-600 font-medium hidden sm:table-cell">{p.hp} HP</td>
                  <td className="px-5 py-4 font-bold text-slate-800">₹{p.price.toLocaleString()}</td>
                  {canWrite && (
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEditClick(p)} className="text-slate-400 hover:text-slate-750 p-1"><Edit3 size={15} /></button>
                        <button onClick={() => handleDeleteItem(p.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {/* Parts Render */}
              {activeTab === "parts" && filteredParts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition text-sm">
                  <td className="px-6 py-4 font-bold text-slate-700 hidden sm:table-cell">{p.id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{p.name}</td>
                  <td className="px-5 py-4 font-bold text-slate-800">₹{p.price.toLocaleString()}</td>
                  <td className="px-5 py-4 text-slate-600 font-medium hidden sm:table-cell">{p.threshold ?? 3} units</td>
                  {canWrite && (
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEditClick(p)} className="text-slate-400 hover:text-slate-750 p-1"><Edit3 size={15} /></button>
                        <button onClick={() => handleDeleteItem(p.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {/* Suppliers Render */}
              {activeTab === "suppliers" && filteredSuppliers.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition text-sm">
                  <td className="px-6 py-4 font-bold text-slate-700 hidden sm:table-cell">{s.id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{s.name}</td>
                  <td className="px-5 py-4 text-[#173c2d] font-medium">{s.contact}</td>
                  <td className="px-5 py-4 text-slate-600 hidden sm:table-cell">{s.city}</td>
                  {canWrite && (
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEditClick(s)} className="text-slate-400 hover:text-slate-750 p-1"><Edit3 size={15} /></button>
                        <button onClick={() => handleDeleteItem(s.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {/* Employees Render */}
              {activeTab === "employees" && filteredEmployees.map(e => (
                <tr key={e.name} className="hover:bg-slate-50/50 transition text-sm">
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`inline-grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${e.tone}`}>
                      {getInitials(e.name)}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{e.name}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 border px-2 py-0.5 rounded">
                      {e.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{e.contact}</td>
                  <td className="px-5 py-4 text-slate-600 hidden sm:table-cell">{e.city}</td>
                  <td className="px-5 py-4 text-xs max-w-[200px] truncate hidden md:table-cell">
                    {e.permissions ? (
                      Object.entries(e.permissions)
                        .filter(([_, perm]) => perm.read)
                        .map(([mod, perm]) => `${mod} (${perm.write ? "RW" : "R"})`)
                        .join(", ") || "No access"
                    ) : (
                      "Full Access"
                    )}
                  </td>
                  {canWrite && (
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEditClick(e)} className="text-slate-400 hover:text-slate-750 p-1"><Edit3 size={15} /></button>
                        <button onClick={() => handleDeleteItem(e.name)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {/* Customers Render */}
              {activeTab === "customers" && filteredCustomers.map(c => (
                <tr key={c.id} onClick={() => { setSelectedCustDetails(c); setSelectedBranchProfile(null); }} className="hover:bg-slate-50/50 transition text-sm cursor-pointer">
                  <td className="px-6 py-4 font-bold text-slate-700 hidden sm:table-cell">{c.id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    <div className="flex flex-col">
                      <span>{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">{c.address}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{c.contactPerson || "N/A"}</td>
                  <td className="px-5 py-4 text-slate-600 font-medium">{c.phone}</td>
                  <td className="px-5 py-4 text-slate-600 hidden sm:table-cell">{c.city}</td>
                  {canWrite && (
                    <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => navigate(`/orders?search=${c.name}`)}
                          className="inline-flex items-center gap-0.5 text-xs text-[#173c2d] font-bold hover:underline"
                        >
                          <span>Orders</span>
                          <ArrowRight size={12} />
                        </button>
                        <button onClick={() => handleEditClick(c)} className="text-slate-400 hover:text-slate-750 p-0.5"><Edit3 size={15} /></button>
                        <button onClick={() => handleDeleteItem(c.id)} className="text-slate-400 hover:text-red-500 p-0.5"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {/* Cities Render */}
              {activeTab === "cities" && filteredCities.map(c => (
                <tr key={c} className="hover:bg-slate-50/50 transition text-sm">
                  <td className="px-6 py-4 font-bold text-slate-950">{c}</td>
                  <td className="px-5 py-4 text-slate-500">Gujarat, India</td>
                  {canWrite && (
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => handleDeleteItem(c)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={15} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT DIALOG */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {editingItem ? "Edit Master Record" : "Add Master Record"}
              </h3>
              <button onClick={resetForms} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                
                {/* Products Inputs */}
                {activeTab === "products" && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Product ID (e.g. P-105)
                      <input value={prodId} onChange={e => setProdId(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Product Name
                      <input value={prodName} onChange={e => setProdName(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" required />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Model Number
                      <input value={prodModel} onChange={e => setProdModel(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      HP rating (HP)
                      <input type="number" value={prodHp} onChange={e => setProdHp(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Price (₹)
                      <input type="number" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                    </label>
                  </div>
                )}

                {/* Parts Inputs */}
                {activeTab === "parts" && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Part ID (e.g. PT-06)
                      <input value={partId} onChange={e => setPartId(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" required />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Part Name
                      <input value={partName} onChange={e => setPartName(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" required />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Retail Price (₹)
                      <input type="number" value={partPrice} onChange={e => setPartPrice(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" required />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Alert Threshold (units)
                      <input type="number" value={partThreshold} onChange={e => setPartThreshold(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" required />
                    </label>
                  </div>
                )}

                {/* Suppliers Inputs */}
                {activeTab === "suppliers" && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Supplier ID (e.g. S-204)
                      <input value={suppId} onChange={e => setSuppId(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Supplier Company Name
                      <input value={suppName} onChange={e => setSuppName(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" required />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Contact number
                      <input value={suppContact} onChange={e => setSuppContact(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Base City
                      <select value={suppCity} onChange={e => setSuppCity(e.target.value)} className="rounded border bg-white px-3 py-2 text-sm outline-none">
                        <option value="">Select City (Optional)</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </label>
                  </div>
                )}

                {/* Employees Inputs */}
                {activeTab === "employees" && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Employee Name
                      <input value={empName} onChange={e => setEmpName(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" required />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Role / Department
                      <select value={empRole} onChange={e => setEmpRole(e.target.value as UserRole)} className="rounded border bg-white px-3 py-2 text-sm outline-none" required>
                        <option value="">-- Choose Role --</option>
                        <option value="Owner">Owner</option>
                        <option value="Sales Person">Sales Person</option>
                        <option value="Receptionist">Receptionist</option>
                        <option value="Service Engineer">Service Engineer</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Contact number
                      <input value={empContact} onChange={e => setEmpContact(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Base City
                      <select value={empCity} onChange={e => setEmpCity(e.target.value)} className="rounded border bg-white px-3 py-2 text-sm outline-none">
                        <option value="">Select City (Optional)</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </label>

                    {/* Permissions Matrix */}
                    <div className="space-y-2 border-t pt-3">
                      <h4 className="text-xs font-bold text-slate-700">Module Access Permissions</h4>
                      <div className="grid grid-cols-1 gap-2 bg-slate-50 p-3 rounded-lg border text-xs">
                        <div className="grid grid-cols-3 font-semibold text-slate-500 pb-1 border-b text-[10px] uppercase">
                          <span>Module</span>
                          <span className="text-center">Read</span>
                          <span className="text-center">Write</span>
                        </div>
                        {APP_MODULES.map(mod => {
                          const readVal = empPermissions[mod]?.read ?? false;
                          const writeVal = empPermissions[mod]?.write ?? false;
                          return (
                            <div key={mod} className="grid grid-cols-3 items-center py-1">
                              <span className="font-medium text-slate-700">{mod}</span>
                              <div className="text-center">
                                <input
                                  type="checkbox"
                                  checked={readVal}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setEmpPermissions(prev => ({
                                      ...prev,
                                      [mod]: {
                                        read: checked,
                                        write: checked ? prev[mod]?.write ?? false : false
                                      }
                                    }));
                                  }}
                                  className="rounded border-slate-350 text-[#173c2d] focus:ring-[#173c2d]"
                                />
                              </div>
                              <div className="text-center">
                                <input
                                  type="checkbox"
                                  checked={writeVal}
                                  disabled={!readVal}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setEmpPermissions(prev => ({
                                      ...prev,
                                      [mod]: {
                                        ...prev[mod],
                                        write: checked
                                      }
                                    }));
                                  }}
                                  className="rounded border-slate-350 text-[#173c2d] focus:ring-[#173c2d]"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Customers Inputs */}
                {activeTab === "customers" && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Customer ID
                      <input value={custId} onChange={e => setCustId(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Company Name
                      <input value={custName} onChange={e => setCustName(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" required />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Contact Person Name
                      <input value={custContact} onChange={e => setCustContact(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Contact Phone
                      <input value={custPhone} onChange={e => setCustPhone(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      City Location
                      <select value={custCity} onChange={e => setCustCity(e.target.value)} className="rounded border bg-white px-3 py-2 text-sm outline-none">
                        <option value="">Select City (Optional)</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Corporate Address
                      <textarea value={custAddress} onChange={e => setCustAddress(e.target.value)} className="rounded border p-2.5 text-sm outline-none min-h-[60px]" />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      GST Number (Optional)
                      <input value={custGstNumber} onChange={e => setCustGstNumber(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none uppercase" />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      Branches (comma-separated, e.g. Head Office, GIDC Phase II)
                      <input value={custBranches} onChange={e => setCustBranches(e.target.value)} placeholder="Main, Branch A" className="rounded border px-3 py-2 text-sm outline-none" />
                    </label>
                  </div>
                )}

                {/* Cities Inputs */}
                {activeTab === "cities" && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-700 flex flex-col gap-1">
                      New City Name (Gujarat GIDC operations)
                      <input
                        value={newCityName}
                        onChange={e => setNewCityName(e.target.value)}
                        placeholder="e.g. Gandhidham"
                        className="rounded border px-3 py-2 text-sm outline-none"
                        required
                      />
                    </label>
                  </div>
                )}

              </div>

              <div className="flex justify-end gap-2 border-t p-4 bg-slate-50">
                <Button type="button" onClick={resetForms} variant="ghost" className="text-slate-600 text-xs rounded-lg">
                  Cancel
                </Button>
                {canWrite && (
                  <Button type="submit" className="bg-[#173c2d] hover:bg-[#204a3b] text-white text-xs rounded-lg px-4">
                    Save Changes
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedCustDetails && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-scaleUp">
            <div className="border-b p-5 flex items-center justify-between bg-slate-50">
              <div>
                <p className="text-xs font-semibold text-[#58705c] uppercase tracking-wider">Customer Profile</p>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {selectedCustDetails.name}
                </h3>
              </div>
              <button onClick={() => { setSelectedCustDetails(null); setSelectedBranchProfile(null); }} className="rounded-lg p-1.5 hover:bg-slate-100 transition"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Customer Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Customer ID</span>
                  <span className="font-semibold text-slate-800">{selectedCustDetails.id}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Contact Person</span>
                  <span className="font-semibold text-slate-800">{displayDetails?.contactPerson || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Phone Number</span>
                  <span className="font-semibold text-slate-800">{displayDetails?.phone || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">City / Location</span>
                  <span className="font-semibold text-slate-800">{displayDetails?.city || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Registered Address</span>
                  <span className="text-slate-700">{displayDetails?.address || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Registered Branches</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedCustDetails.branches && selectedCustDetails.branches.map(br => (
                      <span 
                        key={br} 
                        onClick={() => setSelectedBranchProfile(selectedBranchProfile === br ? null : br)}
                        className={`text-xs px-2.5 py-0.5 rounded border cursor-pointer ${selectedBranchProfile === br ? 'bg-[#173c2d] text-white border-[#173c2d]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        {br}
                      </span>
                    ))}
                    {(!selectedCustDetails.branches || selectedCustDetails.branches.length === 0) && (
                      <span className="text-xs text-slate-400 italic">No custom branches added</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Complaints Logged</span>
                  <span className="inline-flex items-center gap-1.5 mt-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {complaints.filter(c => c.companyName.toLowerCase() === selectedCustDetails.name.toLowerCase()).length} complaints
                  </span>
                </div>
              </div>

              {/* Customer Orders list */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order History & Placement</h4>
                {(() => {
                  const custOrders = orders.filter(
                    o => o.customerId === selectedCustDetails.id || o.companyName.toLowerCase() === selectedCustDetails.name.toLowerCase()
                  );
                  if (custOrders.length === 0) {
                    return <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border">No orders placed by this customer yet.</p>;
                  }
                  return (
                    <div className="space-y-2">
                      {custOrders.map(order => (
                        <div
                          key={order.id}
                          onClick={() => {
                            navigate(`/orders?orderId=${order.id}&search=${order.id}`);
                          }}
                          className="flex flex-col p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="font-bold text-sm text-slate-900 hover:text-[#173c2d]">{order.id}</span>
                              <div className="flex gap-2 text-xs text-slate-500">
                                <span>Branch: <strong className="text-slate-750">{order.branch || "Main"}</strong></span>
                                <span>•</span>
                                <span>Value: <strong className="text-slate-750 font-bold">₹{(order.orderValue || 0).toLocaleString()}</strong></span>
                              </div>
                            </div>
                            <span className={`text-[11px] font-bold border px-2 py-0.5 rounded-full ${
                                order.status === "Commissioned/Completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                                  : order.status === "Payment Pending"
                                  ? "bg-sky-50 text-sky-700 border-sky-200"
                                  : "bg-slate-50 text-slate-750 border-slate-205"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          {order.productsSelected && order.productsSelected.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {order.productsSelected.map((prod, idx) => (
                                <span key={idx} className="bg-[#173c2d]/10 text-[#173c2d] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#173c2d]/20">
                                  {prod.productName} ({prod.quantity})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end border-t p-4 bg-slate-50">
              <Button type="button" onClick={() => { setSelectedCustDetails(null); setSelectedBranchProfile(null); }} className="bg-slate-800 hover:bg-slate-750 text-white text-xs rounded-lg px-4">
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
