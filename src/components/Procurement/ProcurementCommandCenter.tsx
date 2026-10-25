import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { RequisitionsView } from './RequisitionsView';
import { PurchaseOrdersView } from './PurchaseOrdersView';
import { GRNWorkspace } from './GRNWorkspace';
import { SupplierPayablesView } from './SupplierPayablesView';
import { PurchaseReturnsView } from './PurchaseReturnsView';
import { SupplierIntelligenceScorecard } from './SupplierIntelligenceScorecard';
import { handleWorkspaceTabKeyDown } from '../../utils/workspaceTabs';
import { ShoppingCart, RefreshCw, LayoutDashboard, ClipboardList, Package, PackageCheck, Wallet, Undo2, ChartNoAxesCombined } from 'lucide-react';

type ProcurementTab =
  | 'DASHBOARD'
  | 'REQUISITIONS'
  | 'PURCHASE_ORDERS'
  | 'GRN_RECEIVING'
  | 'INVOICES_MATCH'
  | 'PAYABLES_PAYMENTS'
  | 'PURCHASE_RETURNS'
  | 'SUPPLIER_INTELLIGENCE';

export const ProcurementCommandCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProcurementTab>('DASHBOARD');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/procurement/dashboard');
      if (res.data?.data) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load procurement dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatRupees = (paise: number) => {
    return `₹${((paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6 bg-surface text-foreground-strong min-h-screen">
      {/* HEADER */}
      <div className="flex flex-wrap gap-3 justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="flex items-center gap-2"><ShoppingCart size={22} className="text-primary" aria-hidden /> Procurement</h1>
          <p className="text-xs text-muted mt-1">Purchasing, receiving, and supplier payments.</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <span className="text-xs text-warning font-semibold animate-pulse">Syncing...</span>}
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-surface hover:bg-surface-alt border border-border text-foreground transition-colors"
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} aria-hidden /> Refresh
          </button>
        </div>
      </div>

      {/* TOP LEVEL NAVIGATION TABS */}
      <div className="workspace-tabs" role="tablist" aria-label="Procurement views" onKeyDown={handleWorkspaceTabKeyDown}>
        {[
          { id: 'DASHBOARD', label: 'Overview', icon: LayoutDashboard },
          { id: 'REQUISITIONS', label: 'Requisitions', icon: ClipboardList },
          { id: 'PURCHASE_ORDERS', label: 'Purchase orders', icon: Package },
          { id: 'GRN_RECEIVING', label: 'Receiving', icon: PackageCheck },
          { id: 'PAYABLES_PAYMENTS', label: 'Payables', icon: Wallet },
          { id: 'PURCHASE_RETURNS', label: 'Returns', icon: Undo2 },
          { id: 'SUPPLIER_INTELLIGENCE', label: 'Suppliers', icon: ChartNoAxesCombined },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            id={`procurement-tab-${tab.id}`}
            aria-controls="procurement-panel"
            onClick={() => setActiveTab(tab.id as ProcurementTab)}
            className={`flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'bg-surface-elevated text-success border-success/25 shadow-md'
                : 'text-muted hover:text-foreground-strong border-transparent hover:bg-surface-elevated/50'
            }`}
          >
            <tab.icon size={14} aria-hidden /> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT AREA */}
      <div className="flex-1 min-h-0" id="procurement-panel" role="tabpanel" aria-labelledby={`procurement-tab-${activeTab}`}>
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* KPI STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-surface-elevated/80 border border-border shadow">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider">Open Requisitions</div>
                <div className="text-3xl font-black text-warning mt-2">
                  {dashboardData?.openRequisitionsCount || 0}
                </div>
                <div className="text-xs text-warning/80 mt-1 font-medium">
                  {dashboardData?.pendingApprovalsCount || 0} pending approval
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated/80 border border-border shadow">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider">Open PO Pipeline</div>
                <div className="text-3xl font-black text-info mt-2">
                  {dashboardData?.openPurchaseOrdersCount || 0}
                </div>
                <div className="text-xs text-info/80 mt-1 font-medium">
                  Value: {formatRupees(dashboardData?.openPurchaseOrdersValuePaise || 0)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated/80 border border-border shadow">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider">Receiving & Exceptions</div>
                <div className="text-3xl font-black text-danger mt-2">
                  {dashboardData?.invoiceMatchExceptionsCount || 0}
                </div>
                <div className="text-xs text-danger/80 mt-1 font-medium">
                  {dashboardData?.grnsPendingReviewCount || 0} GRNs pending review
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated/80 border border-border shadow">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider">Supplier Liabilities</div>
                <div className="text-2xl font-black text-success mt-2">
                  {formatRupees(dashboardData?.totalSupplierOutstandingPaise || 0)}
                </div>
                <div className="text-xs text-success/80 mt-1 font-medium">
                  Overdue: {formatRupees(dashboardData?.overduePayablesPaise || 0)}
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS & NOTICES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2 p-5 rounded-xl bg-surface-elevated/40 border border-border">
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">
                  Procurement Workflow Gating & Controls
                </h2>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted">
                  <div className="p-3 bg-surface/60 rounded border border-border">
                    <span className="font-bold text-foreground-strong block mb-1">🛡️ Immutable Inward (GRN)</span>
                    Stock quantities and batch weighted average costs are strictly committed at GRN posting. Rejected units are isolated.
                  </div>
                  <div className="p-3 bg-surface/60 rounded border border-border">
                    <span className="font-bold text-foreground-strong block mb-1">🔍 3-Way Match Verification</span>
                    Supplier invoices match against PO rates and GRN accepted counts before liability posting.
                  </div>
                  <div className="p-3 bg-surface/60 rounded border border-border">
                    <span className="font-bold text-foreground-strong block mb-1">⚖️ Free Quantity & Scheme Audit</span>
                    Commercial engine captures free quantities (e.g. 10+2) and calculates actual effective unit cost.
                  </div>
                  <div className="p-3 bg-surface/60 rounded border border-border">
                    <span className="font-bold text-foreground-strong block mb-1">📜 Debit Note Reconciliation</span>
                    Purchase returns immediately generate statutory debit notes and reduce supplier payable balance.
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-surface-elevated/40 border border-border flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">
                    Commercial Scheme Savings
                  </h2>
                  <div className="text-3xl font-black text-success mt-2">
                    {formatRupees(dashboardData?.schemeSavingsMonthPaise || 0)}
                  </div>
                  <p className="text-xs text-muted mt-2">
                    Realized supplier trade discounts and free-unit value acquired this period.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <button
                    onClick={() => setActiveTab('REQUISITIONS')}
                    className="flex-1 py-2 text-xs font-bold rounded bg-success hover:bg-success text-on-primary transition"
                  >
                    + New Requisition
                  </button>
                  <button
                    onClick={() => setActiveTab('GRN_RECEIVING')}
                    className="flex-1 py-2 text-xs font-bold rounded bg-info hover:bg-info text-foreground-strong transition"
                  >
                    Receive Stock (GRN)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'REQUISITIONS' && <RequisitionsView />}
        {activeTab === 'PURCHASE_ORDERS' && <PurchaseOrdersView />}
        {activeTab === 'GRN_RECEIVING' && <GRNWorkspace />}
        {activeTab === 'PAYABLES_PAYMENTS' && <SupplierPayablesView />}
        {activeTab === 'PURCHASE_RETURNS' && <PurchaseReturnsView />}
        {activeTab === 'SUPPLIER_INTELLIGENCE' && <SupplierIntelligenceScorecard />}
      </div>
    </div>
  );
};
export default ProcurementCommandCenter;
