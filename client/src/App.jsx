import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Explore from './pages/Explore';
import EventDetails from './pages/EventDetails';
import MyRegistrations from './pages/MyRegistrations';
import Profile from './pages/Profile';
import Dashboard from './pages/organizer/Dashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import EditEvent from './pages/organizer/EditEvent';
import Participants from './pages/organizer/Participants';
import EventAnalytics from './pages/organizer/EventAnalytics';
import OrganizerAnalytics from './pages/organizer/Analytics';
import { ProtectedRoute } from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/explore" element={<Explore />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/my-registrations" element={<MyRegistrations />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<ProtectedRoute roles={['organizer']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/organizer/events/new" element={<CreateEvent />} />
            <Route path="/organizer/events/:id/edit" element={<EditEvent />} />
            <Route path="/organizer/events/:id/participants" element={<Participants />} />
            <Route path="/organizer/events/:id/analytics" element={<EventAnalytics />} />
            <Route path="/organizer/analytics" element={<OrganizerAnalytics />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
