const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer"); 
const path = require("path");
const nodemailer = require("nodemailer"); 
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 'uploads' folder public karnyasaathi
app.use("/uploads", express.static("uploads"));

// --- PostgreSQL Database Connection (Updated for Render) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Cloud DB sathi he garjeche aahe
  }
});

pool.connect()
  .then(() => console.log("PostgreSQL Database Connected Successfully!"))
  .catch((err) => console.error("Database Connection Error", err.stack));

// --- Nodemailer Setup ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'prashantbhale80@gmail.com', 
    pass: 'keaylaznvlzsbfjd' 
  }
});

// --- Multer Storage Setup ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});
const upload = multer({ storage: storage });

// --- 1. User Registration API ---
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, password_hash, role]
    );

    res.json({ message: "User registered successfully!", user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error: Registration failed");
  }
});

// --- 2. User Login API ---
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { id: user.rows[0].user_id, role: user.rows[0].role },
      "secretkey", 
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login Successful",
      token,
      user: {
        id: user.rows[0].user_id,
        name: user.rows[0].name,
        role: user.rows[0].role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error: Login failed");
  }
});

// --- 3. Post a Job API ---
app.post("/jobs", async (req, res) => {
  try {
    const { employer_id, title, description, location } = req.body;
    const newJob = await pool.query(
      "INSERT INTO jobs (employer_id, title, description, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [employer_id, title, description, location]
    );
    res.json({ message: "Job posted successfully!", job: newJob.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error: Job posting failed");
  }
});

// --- 4. Get All Jobs API ---
app.get("/jobs", async (req, res) => {
  try {
    const allJobs = await pool.query("SELECT * FROM jobs ORDER BY posted_at DESC");
    res.json(allJobs.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error: Could not fetch jobs");
  }
});

// --- 5. Apply for a Job API (Updated with Email Notification) ---
app.post("/apply", upload.single("resume"), async (req, res) => {
  try {
    const { job_id, candidate_id } = req.body;
    
    const resume_link = req.file ? `/uploads/${req.file.filename}` : null;

    // Database madhye application save karne
    const newApplication = await pool.query(
      "INSERT INTO applications (job_id, candidate_id, resume_link) VALUES ($1, $2, $3) RETURNING *",
      [job_id, candidate_id, resume_link]
    );

    // Email pathvnyasathi candidate ani job chi details fetch karne
    const userRes = await pool.query("SELECT email, name FROM users WHERE user_id = $1", [candidate_id]);
    const jobRes = await pool.query("SELECT title FROM jobs WHERE job_id = $1", [job_id]);

    if (userRes.rows.length > 0 && jobRes.rows.length > 0) {
      const candidateEmail = userRes.rows[0].email;
      const candidateName = userRes.rows[0].name;
      const jobTitle = jobRes.rows[0].title;

      const mailOptions = {
        from: 'prashantbhale80@gmail.com', 
        to: candidateEmail, 
        subject: `Application Received: ${jobTitle}`,
        text: `Hello ${candidateName},\n\nYour application for the role of '${jobTitle}' has been successfully received along with your resume.\n\nThank you for applying!\n\nBest Regards,\nJobBoard. Team`
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.error("Email Pathvnyat Error:", error);
        } else {
          console.log('Email Sent Successfully: ' + info.response);
        }
      });
    }

    res.json({ message: "Applied successfully!", application: newApplication.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error: Application failed");
  }
});

// --- 6. Employer Dashboard API ---
app.get("/employer/jobs/:id", async (req, res) => {
  try {
    const employerId = req.params.id;
    const jobs = await pool.query("SELECT * FROM jobs WHERE employer_id = $1 ORDER BY posted_at DESC", [employerId]);
    res.json(jobs.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- 7. Candidate Dashboard API ---
app.get("/candidate/applications/:id", async (req, res) => {
  try {
    const candidateId = req.params.id;
    const applications = await pool.query(`
      SELECT applications.application_id, applications.applied_at, jobs.title, jobs.location 
      FROM applications 
      JOIN jobs ON applications.job_id = jobs.job_id 
      WHERE applications.candidate_id = $1 
      ORDER BY applications.applied_at DESC
    `, [candidateId]);
    res.json(applications.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});