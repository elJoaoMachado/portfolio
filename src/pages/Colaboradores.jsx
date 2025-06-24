import * as React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Switch, FormControlLabel, Snackbar, Alert,
  TablePagination, Box, Typography, Chip
} from '@mui/material';
import { Edit, Delete, Search } from '@mui/icons-material';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { getFunctions, httpsCallable } from 'firebase/functions';


function Colaboradores() {
  const [rows, setRows] = React.useState([]);
  const [filteredRows, setFilteredRows] = React.useState([]);
  const [selectedEmployee, setSelectedEmployee] = React.useState(null);
  const [newEmployee, setNewEmployee] = React.useState(null);
  const [employeeToDelete, setEmployeeToDelete] = React.useState(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const navigate = useNavigate();
  const departamentos = ['HR', 'Finance', 'Technology'];
  const [showAdminSnackbar, setShowAdminSnackbar] = React.useState(false);


  // Carregar colaboradores da coleção 'users'
  const fetchEmployees = async () => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const allUsers = querySnapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
    setRows(allUsers);
    setFilteredRows(allUsers);
  };

  // Verificar se utilizador é admin
  const checkAdminAccess = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      setIsAdmin(userData.isAdmin === true);
    } else {
      setError('Account not registered in database.');
      navigate('/perfil');
    }
  };

  React.useEffect(() => {
    checkAdminAccess();
    fetchEmployees();
    // Verifica se o admin acabou de logar
    if (localStorage.getItem('adminJustLoggedIn') === 'true') {
      setShowAdminSnackbar(true);
      localStorage.removeItem('adminJustLoggedIn');
    }
  }, []);

  // Filter rows based on search term
  React.useEffect(() => {
    const filtered = rows.filter(row =>
      row.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.Department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRows(filtered);
    setPage(0);
  }, [searchTerm, rows]);

  const handleAddEmployee = async () => {
    if (!newEmployee?.email || !newEmployee?.name) {
      setError('Name and email are required.');
      return;
    }
    
    const auth = getAuth();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newEmployee.email, newEmployee.password);
      const user = userCredential.user;

      await addDoc(collection(db, 'users'), {
        ...newEmployee,
        uid: user.uid, 
        isAdmin: false
      });

      setNewEmployee(null);
      await fetchEmployees();
      setSuccess('Employee added successfully!');
    } catch (error) {
      console.error("Error creating employee:", error.code, error.message);
      setError(`Error creating employee: ${error.message}`);
    }
  };

  const handleSave = async () => {
    try {
      const ref = doc(db, 'users', selectedEmployee.docId);
      await updateDoc(ref, { ...selectedEmployee });
      setSelectedEmployee(null);
      await fetchEmployees();
      setSuccess('Employee updated successfully!');
    } catch (error) {
      setError('Error updating employee.');
    }
  };

  const handleDelete = async () => {
    try {
      const ref = doc(db, 'users', employeeToDelete.docId);
      await deleteDoc(ref);
      setEmployeeToDelete(null);
      await fetchEmployees();
      setSuccess('Employee deleted successfully!');
    } catch (err) {
      console.error("Error deleting employee:", err);
      setError('Error deleting employee.');
    }
  };

  const handleToggleAdmin = async (employee) => {
    try {
      const ref = doc(db, 'users', employee.docId);
      await updateDoc(ref, { isAdmin: !employee.isAdmin });
      await fetchEmployees();
      setSuccess(`Admin status ${!employee.isAdmin ? 'granted' : 'removed'} successfully!`);
    } catch (error) {
      setError('Error updating admin status.');
    }
  };

  const handleEditChange = (field, value) => {
    setSelectedEmployee(prev => ({ ...prev, [field]: value }));
  };

  const handleNewEmployeeChange = (field, value) => {
    setNewEmployee(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCloseSnackbar = () => {
    setSuccess('');
    setError('');
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, px: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', fontFamily: 'Poppins, sans-serif', ml: 0 }}>
          Employees
        </Typography>
        {isAdmin && (
          <Button 
            variant="contained" 
            onClick={() => setNewEmployee({ name: '', email: '', date: '', Department: '', contractType: '', password: '' })}
            sx={{ fontWeight: 'bold', fontFamily: 'Poppins, sans-serif' }}
          >
            Add Employee
          </Button>
        )}
      </Box>

      {/* Search Bar */}
      <Box mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name, email, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          size="small"
        />
      </Box>

      {newEmployee && (
        <Dialog open onClose={() => setNewEmployee(null)} maxWidth="sm" fullWidth>
          <DialogTitle>New Employee</DialogTitle>
          <DialogContent>
            <TextField 
              label="Name" 
              fullWidth 
              margin="dense" 
              value={newEmployee.name} 
              onChange={(e) => handleNewEmployeeChange('name', e.target.value)} 
            />
            <TextField 
              label="Email" 
              fullWidth 
              margin="dense" 
              value={newEmployee.email} 
              onChange={(e) => handleNewEmployeeChange('email', e.target.value)} 
            />
            <TextField 
              label="Admission Date" 
              fullWidth 
              margin="dense" 
              type="date" 
              value={newEmployee.date} 
              onChange={(e) => handleNewEmployeeChange('date', e.target.value)} 
              InputLabelProps={{ shrink: true }} 
            />
            <FormControl fullWidth margin="dense">
              <InputLabel id="departamento-label">Department</InputLabel>
              <Select 
                labelId="departamento-label" 
                value={newEmployee.Department} 
                label="Department" 
                onChange={(e) => handleNewEmployeeChange('Department', e.target.value)}
              >
                {departamentos.map((dep) => (
                  <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField 
              label="Password" 
              fullWidth 
              margin="dense" 
              type="password" 
              value={newEmployee.password || ''} 
              onChange={(e) => handleNewEmployeeChange('password', e.target.value)} 
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewEmployee(null)}>Cancel</Button>
            <Button onClick={handleAddEmployee}>Add</Button>
          </DialogActions>
        </Dialog>
      )}

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Admission Date</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Admin</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <TableRow key={row.docId}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.Department || 'Not assigned'} 
                      size="small" 
                      color={row.Department ? "primary" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={row.isAdmin || false}
                            onChange={() => handleToggleAdmin(row)}
                            color="primary"
                          />
                        }
                        label={row.isAdmin ? "Yes" : "No"}
                      />
                    ) : (
                      <Chip 
                        label={row.isAdmin ? "Yes" : "No"} 
                        size="small" 
                        color={row.isAdmin ? "success" : "default"}
                      />
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <IconButton onClick={() => setSelectedEmployee(row)}>
                        <Edit />
                      </IconButton>
                      <IconButton 
                        sx={{ color: 'red' }} 
                        onClick={() => setEmployeeToDelete(row)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Edit Dialog */}
      {selectedEmployee && (
        <Dialog open onClose={() => setSelectedEmployee(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogContent>
            <TextField 
              label="Name" 
              fullWidth 
              margin="dense" 
              value={selectedEmployee.name} 
              onChange={(e) => handleEditChange('name', e.target.value)} 
            />
            <TextField 
              label="Email" 
              fullWidth 
              margin="dense" 
              value={selectedEmployee.email} 
              onChange={(e) => handleEditChange('email', e.target.value)} 
            />
            <TextField 
              label="Admission Date" 
              fullWidth 
              margin="dense" 
              type="date" 
              value={selectedEmployee.date} 
              onChange={(e) => handleEditChange('date', e.target.value)} 
              InputLabelProps={{ shrink: true }} 
            />
            <FormControl fullWidth margin="dense">
              <InputLabel id="edit-departamento-label">Department</InputLabel>
              <Select 
                labelId="edit-departamento-label" 
                value={selectedEmployee.Department} 
                label="Department" 
                onChange={(e) => handleEditChange('Department', e.target.value)}
              >
                {departamentos.map((dep) => (
                  <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedEmployee(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {employeeToDelete && (
        <Dialog open onClose={() => setEmployeeToDelete(null)}>
          <DialogTitle>Delete Employee</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this employee?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEmployeeToDelete(null)}>Cancel</Button>
            <Button onClick={handleDelete} color="error">Yes, Delete</Button>
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

      <Snackbar open={showAdminSnackbar} autoHideDuration={4000} onClose={() => setShowAdminSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setShowAdminSnackbar(false)} severity="info" sx={{ width: '100%' }}>
          You are logged in as admin.
        </Alert>
      </Snackbar>
    </>
  );
}

export default Colaboradores;