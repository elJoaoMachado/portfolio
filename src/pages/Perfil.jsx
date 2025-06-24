import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar, Paper, Grid, Card, CardContent, Divider, useTheme, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { motion } from 'framer-motion';
import { Person as PersonIcon, Work as WorkIcon, Business as BusinessIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';

const Perfil = () => {
  const [userData, setUserData] = useState(null);
  const [ausenciasHoje, setAusenciasHoje] = useState([]);
  const [users, setUsers] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const theme = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      const q = query(collection(db, 'users'), where('email', '==', user.email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setUserData(snapshot.docs[0].data());
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    // Buscar todos os usuários para saber quem é admin
    const fetchUsers = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => doc.data());
      setUsers(usersList);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchAusenciasHoje = async () => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const ausenciasRef = collection(db, 'ausencias');
      const snapshot = await getDocs(ausenciasRef);
      const ausencias = snapshot.docs.map(doc => doc.data());
      // Mostrar todas as ausências do dia para admin
      const ausentesHoje = ausencias.filter(a => {
        if (!a.data) return false;
        const dataAusencia = new Date(a.data);
        dataAusencia.setHours(0, 0, 0, 0);
        return dataAusencia.getTime() === hoje.getTime();
      });
      setAusenciasHoje(ausentesHoje);
    };
    fetchAusenciasHoje();
  }, []);

  if (!userData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
          Loading profile...
        </Typography>
      </Box>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <Box sx={{ py: 2, px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, px: 2, mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, fontFamily: "'Poppins', sans-serif", ml: 0 }}>
          Profile
        </Typography>
        {/* Se quiseres adicionar um botão de ação no perfil, coloca-o aqui */}
      </Box>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Paper
                elevation={8}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: theme.palette.background.paper,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: theme.shadows[4],
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Avatar
                    src={userData.photoURL || ''}
                    alt="Profile photo"
                    sx={{
                      width: 120,
                      height: 120,
                      mb: 2,
                      border: `4px solid ${theme.palette.primary.main}`,
                      boxShadow: `0 4px 20px ${theme.palette.primary.main}40`,
                    }}
                  />
                </motion.div>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.primary.main,
                    mb: 1,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {userData.name || 'No name'}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 2,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {userData.email}
                </Typography>
                <Divider sx={{ width: '100%', mb: 2 }} />
                <Box sx={{ width: '100%' }}>
                  <Card sx={{ mb: 1, background: theme.palette.action.hover, p: { xs: 0.5, sm: 1 }, width: '100%' }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 1, py: 1.5, minHeight: 56 }}>
                      <WorkIcon sx={{ color: theme.palette.primary.main, fontSize: 20, m: 0 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                          Position
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme.palette.text.primary, fontSize: 14 }}>
                          {userData.role || 'Not defined'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                  <Card sx={{ mb: 1, background: theme.palette.action.hover, p: { xs: 0.5, sm: 1 }, width: '100%' }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 1, py: 1.5, minHeight: 56 }}>
                      <BusinessIcon sx={{ color: theme.palette.primary.main, fontSize: 20, m: 0 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                          Department
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme.palette.text.primary, fontSize: 14 }}>
                          {userData.department || 'Not defined'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                  <Card sx={{ background: theme.palette.action.hover, p: { xs: 0.5, sm: 1 }, width: '100%' }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 1, py: 1.5, minHeight: 56 }}>
                      <CalendarIcon sx={{ color: theme.palette.primary.main, fontSize: 20, m: 0 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                          Admission Date
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme.palette.text.primary, fontSize: 14 }}>
                          {userData.date || '---'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={8}>
            <motion.div variants={itemVariants}>
              <Paper
                elevation={8}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: theme.palette.background.paper,
                  height: '100%',
                  boxShadow: theme.shadows[4],
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.primary.main,
                    mb: 2,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Profile Information
                </Typography>
                <Grid container spacing={2} alignItems="stretch">
                  <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Card sx={{ background: theme.palette.action.hover, height: '100%' }}>
                      <CardContent sx={{ py: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1.5, color: theme.palette.primary.main }}>
                          Personal Data
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Full Name
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                              {userData.name || 'Not defined'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Email
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                              {userData.email || 'Not defined'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Card sx={{ background: theme.palette.action.hover, height: '100%' }}>
                      <CardContent sx={{ py: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1.5, color: theme.palette.primary.main }}>
                          Professional Data
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Position
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                              {userData.role || 'Not defined'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Department
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                              {userData.department || 'Not defined'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Admission Date
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                              {userData.date || '---'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    {userData.isAdmin === true && (
                      <Card sx={{ background: theme.palette.action.hover, mt: 2 }}>
                        <CardContent sx={{ py: 2 }}>
                          <Typography variant="h6" sx={{ mb: 1.5, color: theme.palette.primary.main }}>
                            {`Ausências - ${new Date().toLocaleDateString()}`}
                          </Typography>
                          {ausenciasHoje.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">Ninguém está de férias hoje.</Typography>
                          ) : (
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Nome</TableCell>
                                    <TableCell>Departamento</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {ausenciasHoje.map((a, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{a.nome}</TableCell>
                                      <TableCell>{a.departamento}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default Perfil;
