import React, { useState } from "react";
import {
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Box,
  FormHelperText,
  IconButton,
  CssBaseline,
  Switch,
} from "@mui/material";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// --- Theme with reduced border radius and light/dark mode support ---
const getTheme = (darkMode) =>
  createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: darkMode ? "#64b5f6" : "#1976d2" },
      secondary: { main: "#ff9800" },
      background: {
        default: darkMode ? "#121212" : "#fafafa",
      },
    },
    shape: {
      borderRadius: 4, // reduced curve (default is 4)
    },
    typography: {
      fontFamily: '"Poppins", "Roboto", Arial, sans-serif',
      fontWeightBold: 700,
    },
  });

// Helper to get body temperature status color for helper text
const getBodyTempStatus = (val) => {
  if (val < 36) return { text: "Low", color: "#1e88e5" };
  if (val > 38) return { text: "High", color: "#e53935" };
  return { text: "Normal", color: "#43a047" };
};

// Helper to classify calorie burn result
const getResultMessage = (val) => {
  if (val < 100) return { msg: "Light activity", color: "#4caf50" };
  if (val < 300) return { msg: "Moderate activity", color: "#ffa000" };
  return { msg: "Intense session!", color: "#d32f2f" };
};

export default function App() {
  const [inputs, setInputs] = useState({
    age: "",
    duration: "",
    heart_rate: "",
    body_temp: "",
  });
  const [touched, setTouched] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [recentHistory, setRecentHistory] = useState([]);

  // Validation rules
  const validate = (field, value) => {
    switch (field) {
      case "age":
        if (!value) return "Age is required";
        if (value < 1 || value > 120) return "Enter age between 1 and 120";
        break;
      case "duration":
        if (!value) return "Duration is required";
        if (value < 1 || value > 500) return "Duration must be between 1 and 500 minutes";
        break;
      case "heart_rate":
        if (!value) return "Heart rate is required";
        if (value < 20 || value > 220) return "Heart rate must be between 20 and 220 bpm";
        break;
      case "body_temp":
        if (!value) return "Body temperature is required";
        if (value < 30 || value > 45) return "Body temperature looks suspicious (30-45 °C typical)";
        break;
      default:
        return undefined;
    }
    return undefined;
  };

  // Aggregate errors for visible fields
  const getAllErrors = () =>
    Object.keys(inputs).reduce(
      (acc, field) => ({
        ...acc,
        [field]: touched[field] ? validate(field, inputs[field]) : undefined,
      }),
      {}
    );
    
  const errors = getAllErrors();
  const formError = Object.values(errors).some((e) => !!e);

  // Input change handler with resetting error states
  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
    setTouched({ ...touched, [e.target.name]: true });
    setError("");
    setResult(null);
  };

  // Mark field as touched on blur for validation
  const handleBlur = (e) => setTouched({ ...touched, [e.target.name]: true });

  // Submit handler with API call
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ age: true, duration: true, heart_rate: true, body_temp: true });
    if (formError) return; // Block submission if validation fails

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: parseFloat(inputs.age),
          duration: parseFloat(inputs.duration),
          heart_rate: parseFloat(inputs.heart_rate),
          body_temp: parseFloat(inputs.body_temp),
        }),
      });

      if (!response.ok) throw new Error("Prediction failed");
      const data = await response.json();
      setResult(data.calories_burnt);

      // Store recent prediction history (max 3)
      setRecentHistory(
        [
          {
            ...inputs,
            calories: data.calories_burnt,
            ts: new Date().toLocaleString(),
          },
          ...recentHistory,
        ].slice(0, 3)
      );
    } catch (err) {
      setError("Unable to get prediction. ");
    } finally {
      setLoading(false);
    }
  };

  // Reset form and result/error states
  const handleReset = () => {
    setInputs({ age: "", duration: "", heart_rate: "", body_temp: "" });
    setTouched({});
    setResult(null);
    setError("");
  };

  return (
    <ThemeProvider theme={getTheme(darkMode)}>
      <CssBaseline />
      <Box
        minHeight="100vh"
        sx={{
          background: darkMode
            ? "linear-gradient(135deg, #212121 0%, #37474f 100%)"
            : "linear-gradient(135deg, #e3f2fd 0%, #fafafa 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 4,
          px: 2,
        }}
      >
        <Paper
          elevation={9}
          sx={{
            py: 5,
            px: 4,
            maxWidth: 430,
            width: "100%",
            borderRadius: 4, // less curve
            boxShadow: "0 16px 44px 4px rgba(33,150,243,0.13)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <LocalFireDepartmentIcon
              color="secondary"
              sx={{ fontSize: 48, mr: 1 }}
              aria-hidden="true"
            />
            <Typography variant="h4" fontWeight={700} color="primary" component="h1" tabIndex={0}>
              Calorie Prediction
            </Typography>
            <IconButton
              onClick={() => setDarkMode((v) => !v)}
              aria-label="Toggle light/dark mode"
              sx={{ ml: 1 }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <Switch
              checked={darkMode}
              onChange={() => setDarkMode((v) => !v)}
              color="secondary"
              inputProps={{ "aria-label": "Dark mode toggle switch" }}
              sx={{ ml: 0.5 }}
            />
          </Box>

          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ textAlign: "center", width: "100%", mb: 2, fontWeight: 400 }}
          >
            Enter your details for a smart calorie estimate.<br />
            Typical body temp: 36-38°C; HR: 60-120 bpm
          </Typography>

          <form style={{ width: "100%" }} onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              type="number"
              label="Age"
              name="age"
              value={inputs.age}
              onChange={handleChange}
              onBlur={handleBlur}
              margin="normal"
              required
              error={!!errors.age}
              helperText={errors.age || " "}
              inputProps={{ min: 1, max: 120, "aria-label": "Age in years" }}
            />
            <TextField
              fullWidth
              type="number"
              label="Duration (minutes)"
              name="duration"
              value={inputs.duration}
              onChange={handleChange}
              onBlur={handleBlur}
              margin="normal"
              required
              error={!!errors.duration}
              helperText={errors.duration || " "}
              inputProps={{ min: 1, max: 500, "aria-label": "Workout duration in minutes" }}
            />
            <TextField
              fullWidth
              type="number"
              label="Heart Rate (bpm)"
              name="heart_rate"
              value={inputs.heart_rate}
              onChange={handleChange}
              onBlur={handleBlur}
              margin="normal"
              required
              error={!!errors.heart_rate}
              helperText={errors.heart_rate || " "}
              inputProps={{ min: 20, max: 220, "aria-label": "Heart rate in beats per minute" }}
            />
            <TextField
              fullWidth
              type="number"
              label="Body Temperature (°C)"
              name="body_temp"
              value={inputs.body_temp}
              onChange={handleChange}
              onBlur={handleBlur}
              margin="normal"
              required
              error={!!errors.body_temp}
              helperText={
                errors.body_temp || (
                  <span style={{ color: getBodyTempStatus(Number(inputs.body_temp)).color }}>
                    {getBodyTempStatus(Number(inputs.body_temp)).text}
                  </span>
                )
              }
              inputProps={{ min: 30, max: 45, "aria-label": "Body temperature in Celsius" }}
            />
            <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
                size="large"
                fullWidth
                sx={{ fontWeight: "600", letterSpacing: 1, borderRadius: 4 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Predict"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={loading}
                size="large"
                fullWidth
                sx={{ fontWeight: "600", letterSpacing: 1, borderRadius: 4 }}
              >
                Reset
              </Button>
            </Box>
          </form>

          {error && (
            <Typography color="error" sx={{ mt: 2, textAlign: "center" }} role="alert">
              {error}
            </Typography>
          )}

          {result !== null && !loading && (
            <Paper
              elevation={2}
              sx={{
                mt: 4,
                p: 3,
                bgcolor: getResultMessage(result).color,
                textAlign: "center",
                borderRadius: 4,
                color: "#fff",
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: 0.5,
                boxShadow: "0 4px 18px 2px #90caf966",
                transition: "all 0.4s",
              }}
              aria-live="polite"
              tabIndex={0}
              role="status"
            >
              {getResultMessage(result).msg} <br />
              <span style={{ fontSize: "2rem" }}>{result.toFixed(2)}</span> calories
            </Paper>
          )}

          {recentHistory.length > 0 && (
  <Box mt={4} width="100%" aria-label="Recent estimates">
    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 700 }}>
      Recent Predictions
    </Typography>
    {recentHistory.map((row, idx) => (
      <Paper
        key={idx}
        sx={{
          p: 1.2,
          mb: 1,
          borderRadius: 2,
          background: "#f2f2f2",
          fontSize: 14,
          boxShadow: "none",
        }}
        elevation={0}
      >
        <b>{row.ts}</b>: {Number(row.calories).toFixed(2)} cal{" "}
        <span style={{ color: "#888" }}>
          (
          {row.age}yr, {row.duration}min, {row.heart_rate}bpm, {row.body_temp}°C
          )
        </span>
      </Paper>
    ))}
  </Box>
)}

        </Paper>
      </Box>
    </ThemeProvider>
  );
}
