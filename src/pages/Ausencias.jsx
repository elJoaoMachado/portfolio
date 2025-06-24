import React, { useState, useEffect } from 'react';
import { 
  Container, TextField, Button, Typography, Box, MenuItem, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  FormControl, InputLabel, Select, Snackbar, Alert,
  IconButton, Tooltip, Collapse, Card, CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import dayjs from 'dayjs';
import { db } from '../FirebaseConfig';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { CalendarToday, Add } from '@mui/icons-material';

export default function PaginaAusencias() {
  const [nome, setNome] = useState('');
  const [data, setData] = useState(null);
  const [razao, setRazao] = useState('');
  const [ausencias, setAusencias] = useState([]);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const [showForm, setShowForm] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState(null);

  // Check admin role
  const checkAdminRole = async (user) => {
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        return userData.isAdmin === true;
      }
      return false;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  };

  // Load users for dropdown
  const loadUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  useEffect(() => {
    const initializeUser = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const adminStatus = await checkAdminRole(user);
      setIsAdmin(adminStatus);
      await loadUsers();
      await carregarAusencias();
    };

    const unsubscribe = auth.onAuthStateChanged(initializeUser);
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleAdicionar = async () => {
    if (nome && data && razao) {
      const dataFormatada = dayjs(data).format('YYYY-MM-DD');

      try {
        const docRef = await addDoc(collection(db, 'ausencias'), {
          nome,
          data: dataFormatada,
          razao,
          userId: auth.currentUser?.uid,
          timestamp: new Date().toISOString()
        });

        // Update calendar locally
        const novaAusencia = {
          id: docRef.id,
          title: `${nome} - ${razao}`,
          date: dataFormatada,
          userId: auth.currentUser?.uid,
        };

        setAusencias((prev) => [...prev, novaAusencia]);
        setSuccess('Absence registered successfully!');

        // Clear form
        setNome('');
        setData(null);
        setRazao('');
      } catch (error) {
        console.error('Error adding absence:', error);
        setError('Error registering absence. Please try again.');
      }
    } else {
      setError('All fields must be filled.');
    }
  };

  const carregarAusencias = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const querySnapshot = await getDocs(collection(db, 'ausencias'));
      const ausenciasFirestore = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: `${data.nome} - ${data.razao}`,
          date: data.data,
          userId: data.userId,
          nome: data.nome,
        };
      });
      setAusencias(ausenciasFirestore);
    } catch (error) {
      console.error('Error loading absences:', error);
      setError('Error loading absences.');
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess('');
    setError('');
  };

  const handleEventClick = (clickInfo) => {
    const user = auth.currentUser;
    const eventUserId = clickInfo.event.extendedProps.userId;

    // Permitir que o admin ou o próprio usuário apague a ausência
    if (isAdmin || user.uid === eventUserId) {
      setAbsenceToDelete(clickInfo.event);
    } else {
      setError("You can only delete your own absences.");
    }
  };

  const handleDeleteAbsence = async () => {
    if (!absenceToDelete) return;
    try {
      await deleteDoc(doc(db, 'ausencias', absenceToDelete.id));
      
      // Remover do estado local
      setAusencias(prev => prev.filter(a => a.id !== absenceToDelete.id));
      setAbsenceToDelete(null);
      setSuccess('Absence deleted successfully!');
    } catch (err) {
      console.error("Error deleting absence:", err);
      setError('Error deleting absence.');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md" sx={{ mt: 2, py: 0, px: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, px: 2, mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', fontFamily: 'Poppins, sans-serif', ml: 0 }}>
            Absences
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowForm((prev) => !prev)}
            sx={{ fontWeight: 'bold' }}
          >
            Register Absence
          </Button>
        </Box>
        <Collapse in={showForm}>
          <Card elevation={4} sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" flexDirection="column" gap={1.5}>
                <FormControl fullWidth>
                  <InputLabel>Employee</InputLabel>
                  <Select
                    value={nome}
                    label="Employee"
                    onChange={(e) => setNome(e.target.value)}
                  >
                    {users
                      .filter(user => user.email === auth.currentUser.email)
                      .map(user => (
                        <MenuItem key={user.id} value={user.name}>
                          {user.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <DatePicker
                  label="Absence Date"
                  value={data}
                  onChange={(newValue) => setData(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small"
                    }
                  }}
                />
                <FormControl fullWidth>
                  <InputLabel>Reason</InputLabel>
                  <Select
                    value={razao}
                    label="Reason"
                    onChange={(e) => setRazao(e.target.value)}
                  >
                    <MenuItem value="Sick">Sick</MenuItem>
                    <MenuItem value="Vacation">Vacation</MenuItem>
                    <MenuItem value="Family">Family</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleAdicionar}
                  startIcon={<Add />}
                  sx={{ mt: 1 }}
                >
                  Register
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Collapse>
        <Box mb={2}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={ausencias}
            eventClick={handleEventClick}
            height="500px"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek'
            }}
          />
        </Box>

        {/* Delete Confirmation Dialog */}
        {absenceToDelete && (
          <Dialog open onClose={() => setAbsenceToDelete(null)}>
            <DialogTitle>Delete Absence</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete the absence for{' '}
                <strong>{absenceToDelete.extendedProps.nome}</strong> on{' '}
                <strong>{dayjs(absenceToDelete.start).format('DD/MM/YYYY')}</strong>?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAbsenceToDelete(null)}>Cancel</Button>
              <Button onClick={handleDeleteAbsence} color="error">
                Yes, Delete
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Success/Error Messages */}
        <Snackbar 
          open={!!success} 
          autoHideDuration={4000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="success">
            {success}
          </Alert>
        </Snackbar>
        <Snackbar 
          open={!!error} 
          autoHideDuration={4000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
}