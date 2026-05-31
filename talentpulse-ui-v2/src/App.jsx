import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

// Layouts
import { AuthLayout } from './layouts/AuthLayout/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout/DashboardLayout';

// Pages
import { Login } from './pages/Auth/Login';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { ResetPassword } from './pages/Auth/ResetPassword';
import { LandingPage } from './pages/Landing/LandingPage';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { EmployeeDirectory } from './pages/Employees/EmployeeDirectory';
import { EmployeeProfile } from './pages/Profile/EmployeeProfile';
import { EditProfile } from './pages/Profile/EditProfile';
import { LeavesPage } from './pages/Leaves/LeavesPage';
import { AttendancePage } from './pages/Attendance/AttendancePage';
import { RecruitmentPage } from './pages/Recruitment/RecruitmentPage';
import { HrInterviews } from './pages/Recruitment/HrInterviews';
import { ManagerInterviews } from './pages/Recruitment/ManagerInterviews';
import { PayrollPage } from './pages/Payroll/PayrollPage';
import { AppraisalPage } from './pages/Appraisal/AppraisalPage';
import { AdminPage } from './pages/Admin/AdminPage';
import { GrievancesPage } from './pages/Grievances/GrievancesPage';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Analytics />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<EmployeeDirectory />} />
          <Route path="/profile" element={<EmployeeProfile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leaves" element={<LeavesPage />} />
          <Route path="/leaves/apply" element={<LeavesPage />} />
          <Route path="/grievances" element={<GrievancesPage />} />
          
          {/* Recruitment routes */}
          <Route path="/recruitment" element={<RecruitmentPage />} />
          <Route path="/jobs" element={<RecruitmentPage />} />
          <Route path="/jobs/create" element={<RecruitmentPage />} />
          <Route path="/candidates" element={<RecruitmentPage />} />
          <Route path="/interviews" element={<RecruitmentPage />} />
          <Route path="/interviews/schedule" element={<RecruitmentPage />} />
          <Route path="/offers" element={<RecruitmentPage />} />
          <Route path="/offers/create" element={<RecruitmentPage />} />
          <Route path="/hr-interviews" element={<HrInterviews />} />
          <Route path="/candidate-interviews" element={<ManagerInterviews />} />

          {/* Payroll routes */}
          <Route path="/payroll-runs" element={<PayrollPage />} />
          <Route path="/salary-structures" element={<PayrollPage />} />
          <Route path="/payslips" element={<PayrollPage />} />
          <Route path="/deductions" element={<PayrollPage />} />
          <Route path="/payslips/generate" element={<PayrollPage />} />
          <Route path="/reports" element={<PayrollPage />} />

          {/* Appraisal routes */}
          <Route path="/appraisal" element={<AppraisalPage />} />
          <Route path="/team-performance" element={<AppraisalPage />} />

          {/* Manager & Team Specific */}
          <Route path="/team-attendance" element={<AttendancePage />} />
          <Route path="/leave-approvals" element={<LeavesPage />} />
          <Route path="/team-employees" element={<EmployeeDirectory />} />
          <Route path="/team-reports" element={<PayrollPage />} />

          {/* System Admin specific routes */}
          <Route path="/users" element={<AdminPage />} />
          <Route path="/activations" element={<AdminPage />} />
          <Route path="/users/create" element={<AdminPage />} />
          <Route path="/employees/create" element={<AdminPage />} />
          <Route path="/roles" element={<AdminPage />} />
          <Route path="/roles/assign" element={<AdminPage />} />
          <Route path="/audit-logs" element={<AdminPage />} />
          <Route path="/departments" element={<AdminPage />} />
          <Route path="/settings" element={<AdminPage />} />
          <Route path="/configs" element={<AdminPage />} />
          <Route path="/leaves/config" element={<AdminPage />} />
          <Route path="/policies" element={<AdminPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
