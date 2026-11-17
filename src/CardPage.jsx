
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { QRCodeSVG } from "qrcode.react";
import { Dumbbell, CalendarDays, ShieldCheck, Loader2 } from "lucide-react";
import "./CardPage.css";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CardPage() {
  const { token } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCard() {
      try {
        const snapshot = await getDoc(doc(db, "publicCards", token));

        if (!snapshot.exists()) {
          setError("This membership card could not be found.");
        } else {
          setMember(snapshot.data());
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load your card. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadCard();
  }, [token]);

  if (loading) {
    return (
      <div className="card-message">
        <Loader2 className="spin" />
        Loading membership card...
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="card-message">
        <ShieldCheck size={35} />
        <h2>Card unavailable</h2>
        <p>{error}</p>
      </div>
    );
  }

    const indiaDateParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    }).formatToParts(new Date());

    const indiaToday = `${indiaDateParts.find(p => p.type === "year").value}-${indiaDateParts.find(p => p.type === "month").value}-${indiaDateParts.find(p => p.type === "day").value}`;

    const active = member.validUntil >= indiaToday;

  const cardUrl = window.location.href;

  return (
    <main className="digital-card-page">
      <div className="digital-card">
        <div className="digital-card-top">
          <div className="gym-brand">
            <Dumbbell size={25} />
            <div>
              <strong>{member.gymName || "GYM MANAGER"}</strong>
              <span>MEMBERSHIP CARD</span>
            </div>
          </div>
          <span className="digital-label">DIGITAL</span>
        </div>

        <div className="card-member-info">
          <span className="card-overline">MEMBER NAME</span>
          <h1>{member.name}</h1>
          <span className="card-member-id">
            MEMBER ID: {member.memberId || "GYM MEMBER"}
          </span>
        </div>

        <div className="card-dates">
          <div>
            <CalendarDays size={17} />
            <span>PAYMENT DATE</span>
            <strong>{formatDate(member.paymentDate)}</strong>
          </div>
          <div>
            <CalendarDays size={17} />
            <span>VALID UNTIL</span>
            <strong>{formatDate(member.validUntil)}</strong>
          </div>
        </div>

        <div className="card-bottom">
          <div>
            <span className={`card-status ${active ? "valid" : "invalid"}`}>
              {active ? "ACTIVE MEMBER" : "MEMBERSHIP EXPIRED"}
            </span>
            <p>Present this card at reception.</p>
          </div>
          <div className="qr-container">
            <QRCodeSVG
              value={cardUrl}
              size={190}
              level="H"
              includeMargin
              style={{ display: "block", width: "190px", height: "190px" }}
            />
          </div>
        </div>
      </div>

      <p className="card-security-note">
        <ShieldCheck size={15} />
        Official digital membership card
      </p>
    </main>
  );
}

