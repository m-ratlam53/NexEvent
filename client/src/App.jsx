import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Explore from './pages/Explore';
import EventDetails from './pages/EventDetails';
import MyRegistrations from './pages/MyRegistrations';
import ManageEvents from './pages/organizer/ManageEvents';
import CreateEvent from './pages/organizer/CreateEvent';
import EditEvent from './pages/organizer/EditEvent';
import { ProtectedRoute } from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Explore />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/my-registrations" element={<MyRegistrations />} />

          <Route element={<ProtectedRoute roles={['organizer']} />}>
            <Route path="/organizer/events" element={<ManageEvents />} />
            <Route path="/organizer/events/new" element={<CreateEvent />} />
            <Route path="/organizer/events/:id/edit" element={<EditEvent />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
