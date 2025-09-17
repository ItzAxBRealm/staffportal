import { Route, Routes } from "react-router-dom";
import { 
  AdminAnnouncements,
  AdminDashboard,
  AnnouncementsPage,
  ErrorPage, 
  FAQManagement, 
  FAQPage, 
  HomePage, 
  LoginPage, 
  ManageUsers, 
  NotificationsPage, 
  SignupPage
} from "./pages";

import TicketsListPage from "./pages/tickets/TicketsListPage.jsx";
import TicketDetailPage from "./pages/tickets/TicketDetailPage.jsx";
import NewTicketPage from "./pages/tickets/NewTicketPage.jsx";
import ParticipantTicketsPage from "./pages/tickets/ParticipantTicketsPage.jsx";
import BookingPage from "./pages/meetingRoom/BookingPage.jsx";
import UserProfilePage from "./pages/UserProfilePage";
import ChangePassword from "./pages/auth/ChangePassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import AssignedTicketsPage from "./pages/admin/AssignedTicketsPage";

import { DarkModeProvider } from "./hooks/useDarkMode.jsx";

import { AuthLayout, RootLayout, ProtectedRoute } from "./components";


function App() {
  return (
    <DarkModeProvider>
      <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/register" element={<SignupPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RootLayout />}>

          <Route path="/" index element={<HomePage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/profile" element={<UserProfilePage />} />
          
          <Route path="/bookings" element={<BookingPage />} />
          
          <Route path="/tickets" element={<TicketsListPage />} />
          <Route path="/tickets/participants" element={<ParticipantTicketsPage />} />
          <Route path="/tickets/new" element={<NewTicketPage />} />
          <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
          <Route path="/tickets/edit/:ticketId" element={<NewTicketPage mode="edit" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute adminOnly />}>
        <Route element={<RootLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/faq" element={<FAQManagement />} />
          <Route path="/admin/faq/new" element={<FAQManagement mode="create" />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/announcements/new" element={<AdminAnnouncements mode="create" />} />
          <Route path="/admin/announcements/edit/:id" element={<AdminAnnouncements mode="edit" />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/users/:userId" element={<ManageUsers mode="edit" />} />
          
          <Route path="/admin/tickets" element={<TicketsListPage />} />
          <Route path="/admin/tickets/assigned" element={<AssignedTicketsPage />} />
          <Route path="/admin/tickets/:ticketId" element={<TicketDetailPage adminView />} />
        </Route>
      </Route>

      <Route path="*" element={<ErrorPage />} />
    </Routes>
    </DarkModeProvider>
  );
}

export default App;