import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './Pages/Register'
import Login from './Pages/Login'
import ReportIssue from './Pages/ReportIssue'
import Contributions from './Pages/Contributions'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import DashboardLayout from './Layouts/DashboardLayout'
import DashboardHome from './Pages/DashboardHome'
import AuthorityLayout from './Layouts/AuthorityLayout'
import AuthorityDashboard from './Pages/AuthorityDashboard'
import ComplaintManagement from './Pages/ComplaintManagement'
import Leaderboard from './Pages/Leaderboard'
import CommunityPost from './Pages/CommunityPost'
import Unauthorized from './Pages/Unauthorized'
import RequireAuthority from './components/RequireAuthority'
import ForgotPassword from './Pages/ForgotPassword'
import ResetPassword from './Pages/ResetPassword'
import Documentation from './Pages/Documentation'

function App() {

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
        style={{ zIndex: 100000 }}
      />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/documentation" element={<Documentation />} />

          {/* Dashboard Routes with Layout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="report-issue" element={<ReportIssue />} />
            <Route path="contributions" element={<Contributions />} />
            <Route path="leaderboard" element={<Leaderboard />} />
          </Route>

          {/* Authority Routes - Protected */}
          <Route element={<RequireAuthority />}>
            <Route path="/authority" element={<AuthorityLayout />}>
              <Route index element={<AuthorityDashboard />} />
              <Route path="complaints" element={<ComplaintManagement />} />
              <Route path="community-post" element={<CommunityPost />} />
            </Route>
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </BrowserRouter>

    </>
  )
}

export default App
