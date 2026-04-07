import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// --- Global Backend URL ---
const API_URL = 'https://jobboard-codsoft.onrender.com';

// --- Shared Footer Component ---
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <Link to="/" style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="logo-icon">JB</span>
            <span style={{fontSize: '20px', fontWeight: 'bold', color: 'white'}}>JobBoard</span>
          </Link>
          <p>The premium dark-mode destination for top tech talent and innovative companies to connect.</p>
        </div>
        <div className="footer-links">
          <h4>Company</h4>
          <Link to="/">About Us</Link>
          <Link to="/">Contact Support</Link>
        </div>
        <div className="footer-links">
          <h4>Legal</h4>
          <Link to="/">Privacy Policy</Link>
          <Link to="/">Terms of Service</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} JobBoard. Crafted by Prashant Bhale.</p>
      </div>
    </footer>
  );
}

// --- Smart Navbar Component ---
function Navbar({ isAuthenticated, setAuth, user, context = 'candidate' }) {
  const handleLogout = () => {
    localStorage.clear();
    setAuth(false);
  };

  return (
    <div className="dark-header-section" style={{paddingBottom: '0'}}>
      <header className="full-width-nav">
        <div className="logo">
          <Link to="/">
            <span className="logo-icon">JB</span> JobBoard
          </Link>
        </div>
        <nav className="nav-actions">
          {isAuthenticated ? (
            user.role === 'employer' ? (
              <>
                <span className="user-welcome">Hello, {user.name.split(' ')[0]}</span>
                <Link to="/dashboard">My Postings</Link>
                <Link to="/post-job" className="btn-primary">Post a Job</Link>
                <button onClick={handleLogout} className="btn-outline">Logout</button>
              </>
            ) : (
              <>
                <span className="user-welcome">Hello, {user.name.split(' ')[0]}</span>
                <Link to="/">Find Jobs</Link>
                <Link to="/dashboard">My Applications</Link>
                <button onClick={handleLogout} className="btn-outline">Logout</button>
              </>
            )
          ) : (
            context === 'employer' ? (
              <>
                <Link to="/" className="btn-outline">Looking for a Job?</Link>
                <Link to="/login" className="btn-primary">Sign In</Link>
              </>
            ) : (
              <>
                <Link to="/">Find Jobs</Link>
                <Link to="/login" className="btn-outline">Sign In</Link>
                <Link to="/employer" className="btn-primary">Employers / Post Job</Link>
              </>
            )
          )}
        </nav>
      </header>
    </div>
  );
}

// --- 1. CANDIDATE HOME PAGE ---
function CandidateHome({ isAuthenticated, setAuth, user }) {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/jobs`)
      .then(res => setJobs(res.data))
      .catch(err => console.error("Error fetching jobs"));
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <Navbar isAuthenticated={isAuthenticated} setAuth={setAuth} user={user} context="candidate" />
      <div className="dark-header-section">
        <div className="container">
          <section className="hero" style={{paddingTop: '60px'}}>
            <h2>Find Your Dream Job</h2>
            <p>Explore thousands of job opportunities and find the perfect fit.</p>
            <div className="search-container">
              <input type="text" placeholder="Job title, keywords, or company..." className="search-input" onChange={(e) => setSearchTerm(e.target.value)} />
              <button className="search-btn">Search</button>
            </div>
          </section>
        </div>
      </div>
      <main className="main-content container" style={{ flexGrow: 1 }}>
        <h3 className="section-title">Latest Opportunities</h3>
        <div className="job-grid">
          {filteredJobs.length > 0 ? (
            filteredJobs.map(job => (
              <div key={job.job_id} className="job-card">
                <div className="card-header"><span className="badge">Active</span></div>
                <h3 className="job-title">{job.title}</h3>
                <p className="job-location">{job.location}</p>
                <p className="job-desc">{job.description}</p>
                <div className="card-footer">
                  <span className="date">Posted: {new Date(job.posted_at).toLocaleDateString()}</span>
                  {(!user || user.role === 'candidate') && (
                    <button className="apply-btn" onClick={() => {
                      if (!isAuthenticated) { alert("Please sign in to apply."); navigate('/login'); } 
                      else { alert("Apply feature is ready!"); }
                    }}>Apply Now</button>
                  )}
                </div>
              </div>
            ))
          ) : (<p className="no-jobs">No jobs found.</p>)}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// --- 2. EMPLOYER HOME PAGE ('/employer') ---
function EmployerHome({ isAuthenticated, setAuth, user }) {
  const navigate = useNavigate();
  if (isAuthenticated && user?.role === 'employer') return <Navigate to="/post-job" />;

  return (
    <div className="page-wrapper">
      <Navbar isAuthenticated={isAuthenticated} setAuth={setAuth} user={user} context="employer" />
      <div className="dark-header-section" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="container" style={{ margin: 'auto' }}>
          <section className="hero" style={{paddingTop: '100px'}}>
            <h2>Let's hire your next great candidate. Fast.</h2>
            <p style={{ maxWidth: '600px', margin: '0 auto 40px' }}>
              Join thousands of companies building their dream teams on JobBoard.
            </p>
            <button className="btn-primary" onClick={() => navigate('/login')} style={{fontSize: '18px', padding: '16px 48px'}}>
              Post a Job Now
            </button>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// --- 3. Auth Page (Login & Signup) ---
function AuthPage({ setAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('candidate'); // Default is candidate
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setAuth(true);
        
        // STRICT REDIRECTION LOGIC
        if (res.data.user.role === 'employer') {
          navigate('/post-job'); // Employers go directly to the BIG job post page
        } else {
          navigate('/'); // Candidates go to jobs list
        }
      } else {
        await axios.post(`${API_URL}/register`, { name, email, password, role });
        alert("Account Created! Please sign in.");
        setIsLogin(true);
      }
    } catch (err) { alert(err.response?.data?.message || "Something went wrong!"); }
  };

  return (
    <div className="page-wrapper">
      <Navbar isAuthenticated={false} setAuth={setAuth} user={null} context="candidate" />
      <div className="auth-wrapper dark-header-section" style={{paddingBottom: '40px', borderBottom: 'none'}}>
        <div className="auth-card">
          <h2>{isLogin ? 'Ready to take the next step?' : 'Create an account'}</h2>
          <p style={{color: 'var(--text-muted)', marginBottom: '30px', fontSize: '14px'}}>
            {isLogin ? 'Sign in to access your dashboard.' : 'Join to find your dream job or hire top talent.'}
          </p>
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Account Type (Crucial)</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} style={{border: '1px solid var(--accent-indigo)'}}>
                    <option value="candidate">I am looking for a Job (Candidate)</option>
                    <option value="employer">I want to Post Jobs (Employer)</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" onChange={(e) => setPassword(e.target.value)} required />
            </div>
            
            <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '10px', padding: '14px'}}>
              {isLogin ? 'Continue →' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span style={{ color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// --- 4. Post Job Page (Employer Only - MASSIVE FORM) ---
function PostJobPage({ isAuthenticated, setAuth, user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', location: '', description: '' });

  // STRICT ACCESS CONTROL
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'employer') {
    return (
      <div className="page-wrapper" style={{color: 'white', textAlign: 'center', paddingTop: '100px'}}>
        <h2>Access Denied</h2>
        <p>You are logged in as a Candidate. Please create an Employer account to post jobs.</p>
        <button className="btn-primary" onClick={() => navigate('/')} style={{marginTop: '20px'}}>Go to Home</button>
      </div>
    );
  }

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/jobs`, { ...formData, employer_id: user.id });
      alert("Job posted successfully!");
      navigate('/dashboard');
    } catch (err) { alert("Job posting failed"); }
  };

  return (
    <div className="page-wrapper" style={{backgroundColor: 'var(--body-bg)'}}>
      <Navbar isAuthenticated={isAuthenticated} setAuth={setAuth} user={user} context="employer" />
      
      <main className="main-content container" style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
        <div className="auth-card employer-form-card">
          <h2 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--accent-indigo)' }}>Employer Portal</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '16px' }}>
            Publish a new job opportunity to thousands of candidates. Fill in the details below.
          </p>

          <form onSubmit={handlePostSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Job Title</label>
                <input type="text" placeholder="e.g. Senior Full Stack Engineer" onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Company Name</label>
                <input type="text" placeholder="e.g. TechCorp Solutions" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Job Location</label>
                <input type="text" placeholder="e.g. Pune, Maharashtra (or Remote)" onChange={(e) => setFormData({...formData, location: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Employment Type</label>
                <select required>
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Salary Range (Optional)</label>
                <input type="text" placeholder="e.g. ₹8,00,000 - ₹12,00,000 LPA" />
              </div>
              <div className="form-group">
                <label>Key Skills Required</label>
                <input type="text" placeholder="e.g. React, Node.js, PostgreSQL" />
              </div>
            </div>

            <div className="form-group">
              <label>Detailed Job Description</label>
              <textarea rows="8" placeholder="List the responsibilities, qualifications, and perks..." onChange={(e) => setFormData({...formData, description: e.target.value})} required></textarea>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-outline">Cancel</button>
              <button type="submit" className="btn-primary" style={{padding: '14px 40px', fontSize: '16px'}}>Publish Job to Board</button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// --- 5. Dashboard ---
function Dashboard({ isAuthenticated, setAuth, user }) {
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if(user) {
      const endpoint = user.role === 'employer' 
        ? `/employer/jobs/${user.id}`
        : `/candidate/applications/${user.id}`;
      
      axios.get(`${API_URL}${endpoint}`)
        .then(res => {
          setDashboardData(res.data);
          setLoading(false);
        })
        .catch(err => setLoading(false));
    }
  }, [user]);

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="page-wrapper">
      <Navbar isAuthenticated={isAuthenticated} setAuth={setAuth} user={user} context={user.role} />
      <main className="main-content container" style={{ flexGrow: 1, paddingTop: '60px' }}>
        <h2 className="section-title" style={{fontSize: '32px'}}>Dashboard Overview</h2>
        
        {/* Statistics Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">{user.role === 'employer' ? 'Total Jobs Posted' : 'Total Applied'}</div>
            <div className="stat-value">{dashboardData.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Platform Views</div>
            <div className="stat-value">1,420</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Account Status</div>
            <div className="stat-value" style={{color: 'var(--accent-teal)', fontSize: '24px'}}>Verified</div>
          </div>
        </div>

        <h3 className="section-title">Recent Activity</h3>
        <div className="job-grid">
          {dashboardData.length > 0 ? (
            dashboardData.map((item, i) => (
              <div key={i} className="job-card">
                <div className="card-header"><span className="badge">Active</span></div>
                <h3 className="job-title">{item.title}</h3>
                <p className="job-location">{item.location}</p>
                <div className="card-footer">
                   <span className="date">Status: Live</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{color: 'var(--text-muted)'}}>No recent activity found. Start {user.role === 'employer' ? 'posting jobs' : 'applying'} to see records.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// --- App Entry Point & Router ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Router>
      <Routes>
        <Route path="/" element={<CandidateHome isAuthenticated={isAuthenticated} setAuth={setIsAuthenticated} user={user} />} />
        <Route path="/employer" element={<EmployerHome isAuthenticated={isAuthenticated} setAuth={setIsAuthenticated} user={user} />} />
        <Route path="/login" element={<AuthPage setAuth={setIsAuthenticated} />} />
        <Route path="/post-job" element={<PostJobPage isAuthenticated={isAuthenticated} setAuth={setIsAuthenticated} user={user} />} />
        <Route path="/dashboard" element={<Dashboard isAuthenticated={isAuthenticated} setAuth={setIsAuthenticated} user={user} />} />
      </Routes>
    </Router>
  );
}