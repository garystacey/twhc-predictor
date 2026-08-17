"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function MembersPage() {
  const router = useRouter();

  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [message, setMessage] = useState("");
  const [members, setMembers] = useState([]);

  useEffect(() => {
    async function loadMembers() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || profile.role !== "admin") {
        setMessage(
          "You do not have permission to access this page."
        );
        setLoading(false);
        return;
      }

      setAuthorised(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, team_name, first_name, surname, role, paid, created_at"
        )
        .order("created_at", { ascending: true });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMembers(data || []);
      setLoading(false);
    }

    loadMembers();
  }, [router]);

  function updateMemberField(memberId, field, value) {
    setMembers((current) =>
      current.map((member) =>
        member.id === memberId
          ? { ...member, [field]: value }
          : member
      )
    );
  }

  async function saveMember(member) {
    if (
      !member.first_name ||
      !member.surname ||
      !member.team_name ||
      !member.role
    ) {
      setMessage(
        "Please complete all member fields before saving."
      );
      return;
    }

    setSavingId(member.id);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: member.first_name.trim(),
        surname: member.surname.trim(),
        team_name: member.team_name.trim(),
        role: member.role,
      })
      .eq("id", member.id);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setMessage("Member saved.");
    setSavingId(null);
  }

  async function togglePayment(member) {
    const newPaidStatus = !member.paid;

    setPaymentId(member.id);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        paid: newPaidStatus,
      })
      .eq("id", member.id);

    if (error) {
      setMessage(error.message);
      setPaymentId(null);
      return;
    }

    setMembers((current) =>
      current.map((currentMember) =>
        currentMember.id === member.id
          ? {
              ...currentMember,
              paid: newPaidStatus,
            }
          : currentMember
      )
    );

    const memberName = `${member.first_name || ""} ${
      member.surname || ""
    }`.trim();

    setMessage(
      newPaidStatus
        ? `${memberName || "Member"} marked as PAID.`
        : `${memberName || "Member"} marked as UNPAID.`
    );

    setPaymentId(null);
  }

  async function deleteMember(member) {
    if (member.id === currentUserId) {
      setMessage(
        "You cannot delete your own currently logged-in Admin account."
      );
      return;
    }

    const memberName = `${member.first_name || ""} ${
      member.surname || ""
    }`.trim();

    const displayName =
      memberName || member.team_name || "this member";

    const confirmed = window.confirm(
      `Delete ${displayName}?\n\nThis will permanently delete this member, their login account and all of their Predictor predictions.\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(member.id);
    setMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setMessage(
        "Your login session has expired. Please sign in again."
      );
      setDeletingId(null);
      return;
    }

    try {
      const response = await fetch(
        "/api/admin/delete-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: member.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          result.error || "Could not delete the member."
        );
        setDeletingId(null);
        return;
      }

      setMembers((current) =>
        current.filter(
          (currentMember) =>
            currentMember.id !== member.id
        )
      );

      setMessage(
        `${displayName} has been deleted.`
      );
    } catch (error) {
      console.error("Delete member error:", error);

      setMessage(
        "An unexpected error occurred while deleting the member."
      );
    }

    setDeletingId(null);
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <img
            src="/TWHC-badge-white.png"
            alt="Telford & Wrekin Hockey Club"
            className="club-logo"
          />

          <h1>THE PREDICTOR</h1>
          <p className="subtitle">Members</p>

          <div className="card">
            <p>Loading members...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!authorised) {
    return (
      <main>
        <div className="container">
          <img
            src="/TWHC-badge-white.png"
            alt="Telford & Wrekin Hockey Club"
            className="club-logo"
          />

          <h1>THE PREDICTOR</h1>
          <p className="subtitle">Members</p>

          <div className="card">
            <h2>Access Denied</h2>
            <p>{message}</p>
          </div>

          <a href="/admin">
            <button>Back to Admin</button>
          </a>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container">
        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
          className="club-logo"
        />

        <h1>THE PREDICTOR</h1>
        <p className="subtitle">Members</p>

        {message && (
          <div className="card">
            <p>{message}</p>
          </div>
        )}

        <div className="card">
          <h2>Predictor Members</h2>

          {members.length === 0 ? (
            <p>No members found.</p>
          ) : (
            <div style={{ width: "100%" }}>
              {members.map((member) => {
                const isCurrentUser =
                  member.id === currentUserId;

                return (
                  <div
                    key={member.id}
                    style={{
                      borderBottom:
                        "1px solid #d7dee7",
                      padding: "20px 0",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gap: "14px",
                      }}
                    >
                      <label>
                        <strong>First Name</strong>

                        <input
                          type="text"
                          value={member.first_name || ""}
                          onChange={(e) =>
                            updateMemberField(
                              member.id,
                              "first_name",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px",
                            borderRadius: "8px",
                            border:
                              "1px solid #d7dee7",
                            boxSizing: "border-box",
                            fontSize: "16px",
                          }}
                        />
                      </label>

                      <label>
                        <strong>Surname</strong>

                        <input
                          type="text"
                          value={member.surname || ""}
                          onChange={(e) =>
                            updateMemberField(
                              member.id,
                              "surname",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px",
                            borderRadius: "8px",
                            border:
                              "1px solid #d7dee7",
                            boxSizing: "border-box",
                            fontSize: "16px",
                          }}
                        />
                      </label>

                      <label>
                        <strong>Team Name</strong>

                        <input
                          type="text"
                          value={member.team_name || ""}
                          onChange={(e) =>
                            updateMemberField(
                              member.id,
                              "team_name",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px",
                            borderRadius: "8px",
                            border:
                              "1px solid #d7dee7",
                            boxSizing: "border-box",
                            fontSize: "16px",
                          }}
                        />
                      </label>

                      <label>
                        <strong>Role</strong>

                        <select
                          value={
                            member.role || "entrant"
                          }
                          onChange={(e) =>
                            updateMemberField(
                              member.id,
                              "role",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px",
                            borderRadius: "8px",
                            border:
                              "1px solid #d7dee7",
                            boxSizing: "border-box",
                            fontSize: "16px",
                          }}
                        >
                          <option value="entrant">
                            Entrant
                          </option>

                          <option value="admin">
                            Admin
                          </option>
                        </select>
                      </label>

                      <div
                        style={{
                          padding: "14px",
                          borderRadius: "10px",
                          background: member.paid
                            ? "#e7f7ed"
                            : "#fdeaea",
                          border: member.paid
                            ? "2px solid #1f9d55"
                            : "2px solid #e31b23",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "900",
                            color: member.paid
                              ? "#16733f"
                              : "#c5161d",
                            marginBottom: "10px",
                          }}
                        >
                          {member.paid
                            ? "✓ PAID"
                            : "● UNPAID"}
                        </div>

                        <button
                          onClick={() =>
                            togglePayment(member)
                          }
                          disabled={
                            paymentId === member.id ||
                            deletingId === member.id
                          }
                          style={{
                            background: member.paid
                              ? "#6b7280"
                              : "#1f9d55",
                            color: "#ffffff",
                            opacity:
                              paymentId === member.id ||
                              deletingId === member.id
                                ? 0.5
                                : 1,
                          }}
                        >
                          {paymentId === member.id
                            ? "Updating..."
                            : member.paid
                            ? "Mark as Unpaid"
                            : "Mark as Paid"}
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          saveMember(member)
                        }
                        disabled={
                          savingId === member.id ||
                          deletingId === member.id ||
                          paymentId === member.id
                        }
                        style={{
                          opacity:
                            savingId === member.id ||
                            deletingId === member.id ||
                            paymentId === member.id
                              ? 0.5
                              : 1,
                        }}
                      >
                        {savingId === member.id
                          ? "Saving..."
                          : "Save Member"}
                      </button>

                      <button
                        onClick={() =>
                          deleteMember(member)
                        }
                        disabled={
                          deletingId === member.id ||
                          savingId === member.id ||
                          paymentId === member.id ||
                          isCurrentUser
                        }
                        style={{
                          background: "#e31b23",
                          color: "#ffffff",
                          opacity:
                            deletingId === member.id ||
                            savingId === member.id ||
                            paymentId === member.id ||
                            isCurrentUser
                              ? 0.45
                              : 1,
                        }}
                      >
                        {isCurrentUser
                          ? "Current Admin — Cannot Delete"
                          : deletingId === member.id
                          ? "Deleting Member..."
                          : "Delete Member"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <a href="/admin">
          <button>Back to Admin</button>
        </a>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}
