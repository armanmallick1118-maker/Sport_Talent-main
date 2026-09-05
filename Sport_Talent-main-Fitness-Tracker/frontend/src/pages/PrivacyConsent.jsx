import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PrivacyConsent() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [visibility, setVisibility] = useState("private");

  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianConfirmed, setGuardianConfirmed] = useState(false);

  const [consentStatus, setConsentStatus] = useState("not_requested");

  useEffect(() => {
    const savedProfile = localStorage.getItem("athleteProfile");

    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfile(parsedProfile);
    }

    const savedVisibility =
      localStorage.getItem("profileVisibility");

    if (savedVisibility) {
      setVisibility(savedVisibility);
    }

    const savedConsent =
      localStorage.getItem("guardianConsentStatus");

    if (savedConsent) {
      setConsentStatus(savedConsent);
    }
  }, []);

  const age = Number(profile?.age || profile?.years || 18);

  const isMinor = age < 18;

  const handleVisibilityChange = (value) => {
    // Minor cannot become discoverable without guardian consent
    if (value === "discoverable" && isMinor) {
      if (consentStatus !== "approved") {
        alert(
          "Guardian consent is required before your profile can be discoverable by scouts."
        );
        return;
      }
    }

    setVisibility(value);

    localStorage.setItem(
      "profileVisibility",
      value
    );
  };

  const requestGuardianConsent = () => {
    if (!guardianName.trim() || !guardianEmail.trim()) {
      alert("Please enter the guardian's name and email.");
      return;
    }

    if (!guardianConfirmed) {
      alert(
        "Please confirm that you are requesting consent from your parent or guardian."
      );
      return;
    }

    localStorage.setItem(
      "guardianName",
      guardianName
    );

    localStorage.setItem(
      "guardianEmail",
      guardianEmail
    );

    localStorage.setItem(
      "guardianConsentStatus",
      "pending"
    );

    setConsentStatus("pending");

    alert(
      "Guardian consent request submitted successfully."
    );
  };

  const approveDemoConsent = () => {
    localStorage.setItem(
      "guardianConsentStatus",
      "approved"
    );

    setConsentStatus("approved");

    alert("Demo guardian consent approved.");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">

          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-blue-400">
              Privacy & Consent
            </span>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mt-2">
              Your Privacy Controls
            </h1>

            <p className="text-slate-500 text-sm mt-2">
              Control who can discover your athlete profile.
            </p>
          </div>

          <div className="text-4xl">
            🔒
          </div>

        </div>
      </div>

      {/* Profile Visibility */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">

        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Profile Visibility
        </h2>

        <p className="text-slate-500 text-sm mb-6">
          Choose whether scouts can discover your athlete profile.
        </p>

        {/* Private */}
        <label
          className={`block border rounded-xl p-5 mb-4 cursor-pointer transition ${
            visibility === "private"
              ? "border-blue-500 bg-blue-500/10"
              : "border-slate-200 bg-slate-50"
          }`}
        >

          <div className="flex gap-4">

            <input
              type="radio"
              name="visibility"
              checked={visibility === "private"}
              onChange={() =>
                handleVisibilityChange("private")
              }
              className="mt-1"
            />

            <div>
              <h3 className="text-slate-900 font-semibold">
                Private
              </h3>

              <p className="text-slate-500 text-sm mt-1">
                Your profile will not appear in scout searches.
              </p>
            </div>

          </div>

        </label>

        {/* Discoverable */}
        <label
          className={`block border rounded-xl p-5 cursor-pointer transition ${
            visibility === "discoverable"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-slate-200 bg-slate-50"
          }`}
        >

          <div className="flex gap-4">

            <input
              type="radio"
              name="visibility"
              checked={visibility === "discoverable"}
              onChange={() =>
                handleVisibilityChange("discoverable")
              }
              className="mt-1"
            />

            <div className="flex-1">

              <div className="flex items-center justify-between">

                <h3 className="text-slate-900 font-semibold">
                  Discoverable by Scouts
                </h3>

                {visibility === "discoverable" && (
                  <span className="text-emerald-400 text-xs font-bold">
                    ● ACTIVE
                  </span>
                )}

              </div>

              <p className="text-slate-500 text-sm mt-1">
                Scouts can find your profile through athlete search.
              </p>

            </div>

          </div>

        </label>

      </div>

      {/* Minor Protection */}
      {isMinor && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-6">

          <div className="flex gap-4">

            <div className="text-3xl">
              🛡️
            </div>

            <div>

              <h2 className="text-lg font-bold text-amber-800">
                Guardian Consent Required
              </h2>

              <p className="text-amber-800/80 text-sm mt-2">
                Your profile indicates that you are under 18.
                Guardian consent is required before your profile
                can become discoverable by scouts.
              </p>

            </div>

          </div>

        </div>
      )}

      {/* Guardian Section */}
      {isMinor && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">

          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Guardian Consent
          </h2>

          <p className="text-slate-500 text-sm mb-6">
            Enter your parent or guardian's details to request
            consent for scout discovery.
          </p>

          {/* Guardian Name */}
          <div className="mb-4">

            <label className="block text-sm text-slate-600 mb-2">
              Guardian Name
            </label>

            <input
              type="text"
              value={guardianName}
              onChange={(e) =>
                setGuardianName(e.target.value)
              }
              placeholder="Enter guardian name"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
            />

          </div>

          {/* Guardian Email */}
          <div className="mb-4">

            <label className="block text-sm text-slate-600 mb-2">
              Guardian Email
            </label>

            <input
              type="email"
              value={guardianEmail}
              onChange={(e) =>
                setGuardianEmail(e.target.value)
              }
              placeholder="guardian@example.com"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
            />

          </div>

          {/* Confirmation */}
          <label className="flex gap-3 items-start mb-5 cursor-pointer">

            <input
              type="checkbox"
              checked={guardianConfirmed}
              onChange={(e) =>
                setGuardianConfirmed(e.target.checked)
              }
              className="mt-1"
            />

            <span className="text-sm text-slate-500">
              I confirm that I am requesting consent from my
              parent or legal guardian for my athlete profile
              to be discoverable by scouts.
            </span>

          </label>

          <button
            onClick={requestGuardianConsent}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
          >
            Request Guardian Consent
          </button>

        </div>
      )}

      {/* Consent Status */}
      {isMinor && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">

          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Consent Status
          </h2>

          {consentStatus === "not_requested" && (
            <div className="flex items-center gap-3 text-slate-500">
              <span>⚪</span>
              <span>Not requested</span>
            </div>
          )}

          {consentStatus === "pending" && (
            <>
              <div className="flex items-center gap-3 text-amber-400">
                <span>🟡</span>
                <span className="font-semibold">
                  Guardian consent pending
                </span>
              </div>

              {/* DEMO ONLY */}
              <button
                onClick={approveDemoConsent}
                className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-3 rounded-xl"
              >
                Demo: Approve Guardian Consent
              </button>
            </>
          )}

          {consentStatus === "approved" && (
            <div className="flex items-center gap-3 text-emerald-400">
              <span>🟢</span>

              <div>
                <p className="font-bold">
                  Guardian consent verified
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Scout discovery can now be enabled.
                </p>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Privacy information */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">

        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          How your information is used
        </h2>

        <ul className="space-y-2 text-sm text-slate-500">

          <li>
            • Your profile visibility controls whether scouts can discover you.
          </li>

          <li>
            • You can change your visibility setting at any time.
          </li>

          <li>
            • Assessment results are used to build your sports performance profile.
          </li>

          <li>
            • Minors receive additional privacy and consent protection.
          </li>

        </ul>

      </div>

      {/* Back */}
      <div className="flex justify-center">

        <button
          onClick={() => navigate("/athlete/dashboard")}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3 rounded-xl"
        >
          ← Back to Dashboard
        </button>

      </div>

    </div>
  );
}