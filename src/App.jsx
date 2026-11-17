
import { Html5Qrcode } from "html5-qrcode";
import { getDoc } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { Share2, QrCode } from "lucide-react";
// import { Html5Qrcode } from "html5-qrcode";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import {
  Users,
  UserPlus,
  Search,
  LogOut,
  CalendarDays,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  Loader2,
} from "lucide-react";
import "./App.css";

function todayString() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}


function calculateValidity(paymentDate, months) {
  const [year, month, day] = paymentDate.split("-").map(Number);
  const targetMonth = month - 1 + Number(months);
  const lastDay = new Date(year, targetMonth + 1, 0).getDate();

  const target = new Date(
    year,
    targetMonth,
    Math.min(day, lastDay)
  );

  target.setDate(target.getDate() - 1);

  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}


function formatDate(value) {
  if (!value) return "—";
  return new Date(value + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isActive(member) {
  return member.validUntil >= todayString();
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scannerError, setScannerError] = useState("");
  const scannerRef = useRef(null);
  const scanProcessingRef = useRef(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    paymentDate: todayString(),
    durationMonths: "1",
  });

  function openScanner() {
  setScanResult(null);
  setScannerError("");
  scanProcessingRef.current = false;
  setShowScanner(true);
  }
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  async function loadMembers() {
    if (!auth.currentUser) return;
    setLoadingMembers(true);
    try {
      const snapshot = await getDocs(collection(db, "members"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMembers(data);
    } catch (error) {
      console.error(error);
      setMessage("Couldn't load members. Check your connection and Firestore rules.");
    } finally {
      setLoadingMembers(false);
    }
  }


  async function generateMemberCard(member) {
  if (member.cardToken) {
    return member.cardToken;
  }

  // Generate a cryptographically random, unguessable token.
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);

  const token = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const maskedPhone = member.phone
    ? "******" + member.phone.replace(/\D/g, "").slice(-4)
    : "";

  const publicCard = {
    name: member.name,
    maskedPhone,
    paymentDate: member.paymentDate,
    validUntil: member.validUntil,
    memberId: member.id.slice(-6).toUpperCase(),
    gymName: "GYM MANAGER",
  };

  // Create the public card document.
  await setDoc(doc(db, "publicCards", token), publicCard);

  // Save the private token against the member record.
  await updateDoc(doc(db, "members", member.id), {
    cardToken: token,
  });

  return token;
}

function shareMemberCard(token, memberName) {
  const link = `${window.location.origin}/card/${token}`;

  const message = `Hello ${memberName}! Here is your digital gym membership card: ${link}`;

  window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}


  useEffect(() => {
    if (user) loadMembers();
  }, [user]);

  useEffect(() => {
  if (!showScanner) return;

  let scanner;
  let cancelled = false;

  async function startScanner() {
    try {
      scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          if (scanProcessingRef.current) return;
          scanProcessingRef.current = true;

          try {
            await scanner.stop();
            await scanner.clear();
            scannerRef.current = null;

            if (cancelled) return;

            setShowScanner(false);

            // Accept either a full membership-card URL or a token.
            let token = decodedText.trim();

            try {
              const url = new URL(token);
              const parts = url.pathname.split("/").filter(Boolean);
              token = parts[parts.length - 1];
            } catch {
              // QR contains a token rather than a URL.
            }

            const cardSnapshot = await getDoc(
              doc(db, "publicCards", token)
            );

            if (!cardSnapshot.exists()) {
              setScanResult({
                status: "not-found",
                name: "Unknown member",
                validUntil: "",
              });
              return;
            }

            const card = cardSnapshot.data();

            setScanResult({
              status:
                card.validUntil >= todayString() ? "valid" : "expired",
              name: card.name,
              validUntil: card.validUntil,
            });
          } catch (error) {
            console.error(error);
            setScannerError("Could not verify this membership. Please try again.");
          } finally {
            scanProcessingRef.current = false;
          }
        },
        () => {
          // Ignore normal camera scanning errors while searching for a QR code.
        }
      );
    } catch (error) {
      console.error(error);
      if (!cancelled) {
        setScannerError(
          "Could not open the camera. Please allow camera access and try again."
        );
      }
    }
  }

  startScanner();

    return () => {
      cancelled = true;

      if (scannerRef.current) {
        const currentScanner = scannerRef.current;
        scannerRef.current = null;

        currentScanner
          .stop()
          .then(() => currentScanner.clear())
          .catch(() => {});
        }
      };
  }, [showScanner]);



  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      setLoginError(
        error.code === "auth/invalid-credential"
          ? "Email or password is incorrect."
          : error.message
      );
    }
  }

  async function handleAddMember(event) {
    event.preventDefault();
    setMessage("");

    const name = form.name.trim();
    const phone = form.phone.trim();

    if (!name || !phone || !form.paymentDate) {
      setMessage("Please fill in all required fields.");
      return;
    }

    if (!/^[0-9+\-\s()]{7,18}$/.test(phone)) {
      setMessage("Please enter a valid phone number.");
      return;
    }

    setSaving(true);
    try {
      const validUntil = calculateValidity(
        form.paymentDate,
        form.durationMonths
      );

      
    const memberRef = await addDoc(collection(db, "members"), {
      name,
      phone,
      paymentDate: form.paymentDate,
      durationMonths: Number(form.durationMonths),
      validUntil,
      createdAt: serverTimestamp(),
    });

    await generateMemberCard({
      id: memberRef.id,
      name,
      phone,
      paymentDate: form.paymentDate,
      validUntil,
    });


      setForm({
        name: "",
        phone: "",
        paymentDate: todayString(),
        durationMonths: "1",
      });
      setShowForm(false);
      setMessage("Member added successfully!");
      await loadMembers();
    } catch (error) {
      console.error(error);
      setMessage("Couldn't save member: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  const activeCount = members.filter(isActive).length;
  const expiredCount = members.length - activeCount;

  const filteredMembers = members.filter((member) =>
    `${member.name} ${member.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (authLoading) {
    return <div className="loading-screen"><Loader2 className="spin" /> Loading Gym Manager...</div>;
  }

  if (!user) {
    return (
      <main className="login-page">
        <div className="login-card">
          <div className="brand-mark"><Dumbbell size={27} /></div>
          <p className="eyebrow">GYM MANAGEMENT</p>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to manage your gym members.</p>

          <form onSubmit={handleLogin} className="login-form">
            <label>Email address</label>
            <input
              type="email"
              placeholder="Your owner email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {loginError && <p className="error-text">{loginError}</p>}
            <button className="primary-button" type="submit">Sign in</button>
          </form>
          <p className="login-footnote">Private owner access only</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark small"><Dumbbell size={21} /></div>
          <div>
            <strong>Gym Manager</strong>
            <span>OWNER DASHBOARD</span>
          </div>
        </div>
        <button className="logout-button" onClick={() => signOut(auth)}>
          <LogOut size={17} /> <span>Sign out</span>
        </button>
      </header>

      <section className="content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Your gym at a glance</h1>
            <p className="muted">Manage memberships and payment records.</p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button className="primary-button" onClick={openScanner}>
              <QrCode size={18} />
                Scan QR
            </button>

            <button
              className="primary-button add-top"
              onClick={() => setShowForm(!showForm)}
              >
            <UserPlus size={18} />
              Add member
            </button>
          </div>
        </div>
        {showScanner && (
          <section className="panel">
            <h2>Scan membership QR</h2>
            <p className="muted">Point the camera at a member's digital card.</p>

            {scannerError && <p className="error-text">{scannerError}</p>}

            <div
              id="qr-reader"
              style={{ width: "100%", maxWidth: "420px", margin: "0 auto" }}
            />

            <button
              className="card-action"
              onClick={() => setShowScanner(false)}
            >
              Close scanner
            </button>
          </section>
        )}

        {scanResult && (
          <section className="panel">
            <h2>
              {scanResult.status === "valid"
                ? "VALID MEMBERSHIP"
                : scanResult.status === "expired"
                ? "EXPIRED MEMBERSHIP"
                : "QR NOT RECOGNIZED"}
            </h2>

            <p>Member: {scanResult.name}</p>
            {scanResult.validUntil && (
              <p>Valid until: {formatDate(scanResult.validUntil)}</p>
            )}

            <button className="primary-button" onClick={openScanner}>
              <QrCode size={18} />
              Scan another
            </button>
          </section>
        )}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon neutral"><Users /></div>
            <span>Total members</span>
            <strong>{members.length}</strong>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><CheckCircle2 /></div>
            <span>Active members</span>
            <strong>{activeCount}</strong>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><AlertCircle /></div>
            <span>Expired members</span>
            <strong>{expiredCount}</strong>
          </div>
        </div>

        {message && (
          <div className="notice">
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {showForm && (
          <section className="panel form-panel">
            <div className="panel-heading">
              <div>
                <h2>Add a new member</h2>
                <p className="muted">Enter the member's basic details.</p>
              </div>
              <button className="close-button" onClick={() => setShowForm(false)}>×</button>
            </div>

            <form onSubmit={handleAddMember} className="member-form">
              <div className="field">
                <label>Member name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  required
                />
              </div>
              <div className="field">
                <label>Phone number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>
              <div className="field">
                <label>Payment date *</label>
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Membership duration</label>
                <select
                  value={form.durationMonths}
                  onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                >
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </select>
              </div>
              <div className="form-preview">
                <CalendarDays size={18} />
                <span>Valid until</span>
                <strong>{formatDate(calculateValidity(form.paymentDate, form.durationMonths))}</strong>
              </div>
              <button className="primary-button save-button" disabled={saving}>
                {saving ? <Loader2 className="spin" size={18} /> : <UserPlus size={18} />}
                {saving ? "Saving..." : "Save member"}
              </button>
            </form>
          </section>
        )}

        <section className="panel">
          <div className="panel-heading members-heading">
            <div>
              <h2>Members</h2>
              <p className="muted">Your gym membership register.</p>
            </div>
            <div className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or phone"
              />
            </div>
          </div>

          {loadingMembers ? (
            <div className="empty-state"><Loader2 className="spin" /> Loading members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="empty-state">
              <Users size={34} />
              <strong>{members.length === 0 ? "No members yet" : "No matching members"}</strong>
              <span>{members.length === 0 ? "Add your first member to get started." : "Try another name or phone number."}</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Phone</th>
                    <th>Payment date</th>
                    <th>Valid until</th>
                    <th>Status</th>
                    <th>Digital card</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="member-name">{member.name}</td>
                      <td>{member.phone}</td>
                      <td>{formatDate(member.paymentDate)}</td>
                      <td>{formatDate(member.validUntil)}</td>
                      
                      <td>
                        <span className={`status ${isActive(member) ? "active" : "expired"}`}>
                          {isActive(member) ? "Active" : "Expired"}
                        </span>
                      </td>
                      <td>
                        {member.cardToken ? (
                          <button
                            className="card-action"
                            onClick={() => shareMemberCard(member.cardToken, member.name)}
                          >
                            <Share2 size={15} /> Share
                          </button>
                        ) : (
                          <button
                            className="card-action"
                            onClick={async () => {
                              try {
                                const token = await generateMemberCard(member);
                                await loadMembers();
                                setMessage("Digital card generated successfully!");
                              } catch (error) {
                                console.error(error);
                                setMessage("Card generation failed: " + error.message);
                              }
                            }}
                          >
                            <QrCode size={15} /> Generate card
                          </button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="footer-note">
          <IndianRupee size={14} /> Member records are stored securely in your Firebase database.
        </footer>
      </section>
    </main>
  );
}
