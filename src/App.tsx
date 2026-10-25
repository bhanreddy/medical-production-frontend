import { useEffect, lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate, Link } from 'react-router-dom';
import { AuthFrame } from './components/auth/AuthFrame';
import { ArrowLeft } from 'lucide-react';
import { useAuth, observeAuthSession } from './lib/auth';
import { AuthGuard } from './components/auth/AuthGuard';
import { LoginFlowPage } from './components/auth/LoginFlowPage';
import { HomeRedirect } from './components/auth/HomeRedirect';
import { PaymentReturnPage } from './components/auth/PaymentReturnPage';
import { getUserSubscriptionReturnPath } from './payment/phonePePG/returnPath';
import { RouteError } from './components/RouteError';
import { ClinicProfileSettings } from './components/Settings/ClinicProfileSettings';
import { ExpiryAlertsScreen } from './components/Inventory/ExpiryAlertsScreen';
import { StaffSettings } from './components/Settings/StaffSettings';

const Error403 = () => <AuthFrame title="Access restricted" subtitle="Your account does not have permission to open this page."><Link to="/" className="flex items-center gap-2 text-primary text-sm font-semibold"><ArrowLeft size={16} aria-hidden /> Return to your workspace</Link></AuthFrame>;


// The top level App layout where we check session
const RootLayout = () => {
    const { checkSession } = useAuth();
    
    useEffect(() => {
        const stop = observeAuthSession();
        void checkSession();
        const reconnect = () => { void checkSession(); };
        window.addEventListener('online', reconnect);
        return () => { stop(); window.removeEventListener('online', reconnect); };
        // Background sync is started by ClinicLayout — no duplicate listener here.
    }, [checkSession]);

    return <Suspense fallback={<div role="status" className="p-8 text-muted">Loading page…</div>}><Outlet /></Suspense>;
};

import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminClinics } from './components/admin/AdminClinics';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminSystemHealth } from './components/admin/AdminSystemHealth';
import { AdminClinicProfile } from './components/admin/AdminClinicProfile';

import { ClinicLayout } from './components/clinic/ClinicLayout';
import { ClinicDashboard } from './components/clinic/ClinicDashboard';
const WebPos = lazy(() => import('./components/clinic/WebPos').then(module => ({ default: module.WebPos })));
const RegisterWizard = lazy(() => import('./components/auth/RegisterWizard').then(module => ({ default: module.RegisterWizard })));
import BillingSettings from './routes/(clinic)/settings/billing';
const BusinessAnalyticsScreen = lazy(() => import('./components/Analytics/BusinessAnalyticsScreen').then(module => ({ default: module.BusinessAnalyticsScreen })));
const ImportDataScreen = lazy(() => import('./components/Settings/ImportDataScreen').then(module => ({ default: module.ImportDataScreen })));
import { BillingSalesListPage } from './components/clinic/BillingSalesListPage';
import { PurchasesListPage } from './components/clinic/PurchasesListPage';
import { CustomersListPage } from './components/clinic/CustomersListPage';
import { SuppliersListPage } from './components/clinic/SuppliersListPage';
import { ExpensesListPage } from './components/clinic/ExpensesListPage';
import { ReportsHubPage } from './components/clinic/ReportsHubPage';
import { PurchaseWorkflowPage, InventoryPageShell } from './components/clinic/EmbeddedClinicScreens';
import { ShortbookPage } from './components/clinic/ShortbookPage';
import { SettingsScreen } from './components/Settings/SettingsScreen';
const PriceBooksPage = lazy(() => import('./components/Commercial/PriceBooksPage').then(module => ({ default: module.PriceBooksPage })));
const PromotionsPage = lazy(() => import('./components/Commercial/PromotionsPage').then(module => ({ default: module.PromotionsPage })));
const CouponsPage = lazy(() => import('./components/Commercial/CouponsPage').then(module => ({ default: module.CouponsPage })));
const LoyaltyAdminPage = lazy(() => import('./components/Commercial/LoyaltyAdminPage').then(module => ({ default: module.LoyaltyAdminPage })));
const SupplierSchemesPage = lazy(() => import('./components/Commercial/SupplierSchemesPage').then(module => ({ default: module.SupplierSchemesPage })));
const PrescriptionQueuePage = lazy(() => import('./components/Prescriptions/PrescriptionQueuePage').then(module => ({ default: module.PrescriptionQueuePage })));
const PatientMedicationHistoryPage = lazy(() => import('./components/Prescriptions/PatientMedicationHistoryPage').then(module => ({ default: module.PatientMedicationHistoryPage })));
const InventoryCommandCenter = lazy(() => import('./components/Inventory/InventoryCommandCenter').then(module => ({ default: module.InventoryCommandCenter })));
const StocktakePage = lazy(() => import('./components/Inventory/StocktakePage').then(module => ({ default: module.StocktakePage })));
const ExpiryRecallPage = lazy(() => import('./components/Inventory/ExpiryRecallPage').then(module => ({ default: module.ExpiryRecallPage })));
const ReorderShortbookPage = lazy(() => import('./components/Inventory/ReorderShortbookPage').then(module => ({ default: module.ReorderShortbookPage })));
const ProcurementCommandCenter = lazy(() => import('./components/Procurement/ProcurementCommandCenter').then(module => ({ default: module.ProcurementCommandCenter })));
const TransfersCommandCenter = lazy(() => import('./components/Transfers/TransfersCommandCenter').then(module => ({ default: module.TransfersCommandCenter })));
const OrdersCommandCenter = lazy(() => import('./components/Orders/OrdersCommandCenter').then(module => ({ default: module.OrdersCommandCenter })));

const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        errorElement: <RouteError />,
        children: [
            { index: true, element: <HomeRedirect /> },
            { path: 'login', element: <LoginFlowPage /> },
            { path: 'register', element: <RegisterWizard /> },
            { path: getUserSubscriptionReturnPath(), element: <PaymentReturnPage /> },
            { path: '403', element: <Error403 /> },
            {
                path: 'admin',
                element: (
                    <AuthGuard requireRole={['SUPER_ADMIN']}>
                        <AdminLayout />
                    </AuthGuard>
                ),
                children: [
                    { index: true, element: <Navigate to="dashboard" replace /> },
                    { path: 'dashboard', element: <AdminDashboard /> },
                    { path: 'clinics', element: <AdminClinics /> },
                    { path: 'clinics/:id/profile', element: <AdminClinicProfile /> },
                    { path: 'clinics/:id', element: <AdminClinicProfile /> },
                    { path: 'users', element: <AdminUsers /> },
                    { path: 'system', element: <AdminSystemHealth /> },
                ]
            },
            {
                /* Pathless layout: matches /dashboard, /shortbook, etc. A parent with path: "" can fail to rank /shortbook in the data router. */
                element: (
                    <AuthGuard>
                        <ClinicLayout />
                    </AuthGuard>
                ),
                children: [
                    { path: 'dashboard', element: <ClinicDashboard /> },
                    { path: 'billing', element: <BillingSalesListPage /> },
                    { path: 'billing/new', element: <WebPos /> },
                    { path: 'orders', element: <OrdersCommandCenter /> },
                    { path: 'delivery', element: <OrdersCommandCenter fulfilment="HOME_DELIVERY" /> },
                    { path: 'procurement', element: <ProcurementCommandCenter /> },
                    { path: 'transfers', element: <TransfersCommandCenter /> },
                    { path: 'warehouse', element: <TransfersCommandCenter initialTab="warehouse" /> },
                    { path: 'purchases', element: <PurchasesListPage /> },
                    { path: 'purchases/new', element: <PurchaseWorkflowPage /> },
                    { path: 'inventory', element: <InventoryPageShell /> },
                    { path: 'inventory/command-center', element: <InventoryCommandCenter /> },
                    { path: 'inventory/stocktake', element: <StocktakePage /> },
                    { path: 'inventory/expiry-recall', element: <ExpiryRecallPage /> },
                    { path: 'inventory/reorder', element: <ReorderShortbookPage /> },
                    { path: 'inventory/classic', element: <InventoryPageShell /> },
                    { path: 'shortbook', element: <ShortbookPage /> },
                    { path: 'prescriptions', element: <PrescriptionQueuePage /> },
                    { path: 'patients/:id/medications', element: <PatientMedicationHistoryPage /> },
                    { path: 'customers', element: <CustomersListPage /> },
                    { path: 'suppliers', element: <SuppliersListPage /> },
                    { path: 'expenses', element: <ExpensesListPage /> },
                    { path: 'reports', element: <ReportsHubPage /> },
                    { path: 'price-books', element: <PriceBooksPage /> },
                    { path: 'promotions', element: <PromotionsPage /> },
                    { path: 'coupons', element: <CouponsPage /> },
                    { path: 'loyalty', element: <LoyaltyAdminPage /> },
                    { path: 'supplier-schemes', element: <SupplierSchemesPage /> },
                    { path: 'alerts', element: <ExpiryAlertsScreen /> },
                    { path: 'analytics', element: <BusinessAnalyticsScreen /> },
                    { path: 'settings', element: <SettingsScreen /> },
                    { path: 'settings/clinic', element: <ClinicProfileSettings /> },
                    {
                        path: 'settings/billing',
                        element: (
                            <AuthGuard requireRole={['OWNER']}>
                                <BillingSettings />
                            </AuthGuard>
                        ),
                    },
                    {
                        path: 'settings/users',
                        element: (
                            <AuthGuard requireRole={['OWNER']}>
                                <StaffSettings />
                            </AuthGuard>
                        ),
                    },
                    { path: 'settings/invoice', element: <ClinicProfileSettings invoiceOnly /> },
                    {
                        path: 'settings/import',
                        element: (
                            <AuthGuard requireRole={['OWNER']}>
                                <ImportDataScreen />
                            </AuthGuard>
                        ),
                    },
                ],
            },
        ]
    }
]);

function App() {
    return <RouterProvider router={router} />;
}

export default App;
