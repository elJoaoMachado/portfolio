import React, { useState } from "react";
import { TextField, Button, Container, Typography, Box, Alert, Paper } from "@mui/material";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, browserPopupRedirectResolver } from "firebase/auth";
import { auth } from "../FirebaseConfig";
import { useNavigate } from "react-router-dom"; // Navegação via React Router
import googleLogo from "../pages/google-logo.png";
import logo from "../pages/logoTechnoSoftware.png";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); 
  const db = getFirestore();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user exists in database
      const q = query(collection(db, "users"), where("email", "==", user.email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // If user doesn't exist in database, logout and show error
        await auth.signOut();
        setError("User not found. Please try again.");
        navigate("/");
        return;
      }

      // Verifica se é admin
      const userData = querySnapshot.docs[0].data();
      if (userData.isAdmin === true) {
        localStorage.setItem('adminJustLoggedIn', 'true');
      }

      // If user exists, redirect to profile
      navigate("/perfil");
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setIsLoading(true);
      setError("");
      
      // Configure Google provider
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // Try to login with Google
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      const user = result.user;

      // Check if user exists in database
      const q = query(collection(db, "users"), where("email", "==", user.email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // If user doesn't exist in database, logout and show error
        await auth.signOut();
        setError("User not found. Please try again.");
        navigate("/");
        return;
      }

      // Verifica se é admin
      const userData = querySnapshot.docs[0].data();
      if (userData.isAdmin === true) {
        localStorage.setItem('adminJustLoggedIn', 'true');
      }

      // If user exists, redirect to profile
      navigate("/perfil");
    } catch (err) {
      console.error("Google login error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Login cancelled. Please try again.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup was blocked. Please allow popups for this site.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("Login cancelled. Please try again.");
      } else {
        setError("Google login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        minWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        padding: 0,
        margin: 0,
        gap: 0,
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%' }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{
              width: 100,
              height: "auto",
              display: "block",
              margin: "0 auto 1.5rem",
              filter: "drop-shadow(0 0 8px rgba(26, 35, 126, 0.3))",
            }}
          />
        </motion.div>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{
            color: "#fff",
            fontWeight: "bold",
            mb: 2,
            fontFamily: "'Poppins', sans-serif",
            letterSpacing: 1,
          }}
        >
          Welcome
        </Typography>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%' }}
          >
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </motion.div>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: '100%', maxWidth: 400, mx: 'auto' }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
            disabled={isLoading}
            sx={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 2,
              input: { color: '#fff' },
              label: { color: '#fff' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#4f8cff' },
                '&:hover fieldset': { borderColor: '#fff' },
              },
            }}
            InputLabelProps={{ style: { color: '#fff' } }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            disabled={isLoading}
            sx={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 2,
              input: { color: '#fff' },
              label: { color: '#fff' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#4f8cff' },
                '&:hover fieldset': { borderColor: '#fff' },
              },
            }}
            InputLabelProps={{ style: { color: '#fff' } }}
          />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleLogin}
              disabled={isLoading}
              sx={{
                mt: 1,
                mb: 1,
                py: 1.7,
                fontWeight: 'bold',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.15rem',
                letterSpacing: 1,
                boxShadow: '0 4px 24px 0 rgba(79,140,255,0.25)',
                background: 'linear-gradient(90deg, #4f8cff 0%, #1a237e 100%)',
                color: '#fff',
                textShadow: '0 1px 4px rgba(0,0,0,0.15)',
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  background: 'linear-gradient(90deg, #1a237e 0%, #4f8cff 100%)',
                  boxShadow: '0 6px 32px 0 rgba(79,140,255,0.35)',
                },
              }}
            >
              {isLoading ? "Signing in..." : "SIGN IN"}
            </Button>
          </motion.div>
          <Typography
            variant="body2"
            align="center"
            sx={{ color: "#fff", my: 1.5 }}
          >
            or
          </Typography>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleGoogleLogin}
              disabled={isLoading}
              startIcon={
                <img
                  src={googleLogo}
                  alt="Google logo"
                  style={{ width: 20, height: 20 }}
                />
              }
              sx={{
                py: 1.5,
                borderColor: "#fff",
                color: "#fff",
                fontWeight: 'bold',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1rem',
                '&:hover': {
                  borderColor: '#4f8cff',
                  backgroundColor: 'rgba(79, 140, 255, 0.08)',
                },
              }}
            >
              {isLoading ? "Signing in..." : "Sign in with Google"}
            </Button>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
}
