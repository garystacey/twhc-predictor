"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function MembersPage() {
  const router = useRouter();

  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [message, setMessage] = useState("");
  const [members, setMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [search, setSearch] = useState("");

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

      if (
        profileError ||
        !profile ||
        profile.role !== "admin"
      ) {
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

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return members;

    return members.filter((member) => {
      const fullName = `${member.first_name || ""} ${
        member.surname || ""
      }`.toLowerCase();

      const team = (member.team_name || "").toLowerCase();
      const role = (member.role || "").toLowerCase();

      return (
        fullName.includes(term) ||
        team.includes(term) ||
        role.includes(term)
      );
    });
  }, [members, search]);

  function openEditor(member) {
    setMessage("");
    setEditingMember({ ...member });
  }

  function closeEditor() {
    if (savingId || deletingId) return;
    setEditingMember(null);
  }

  function updateEditingField(field, value) {
    setEditingMember((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveMember() {
    if (!editingMember) return;

    if (
      !editingMember.first_name ||
      !editingMember.surname ||
      !editingMember.team_name ||
      !editingMember.role
    ) {
      setMessage(
        "Please complete all member fields before saving."
      );
      return;
    }

    setSavingId(editingMember.id);
    setMessage("");

    const updatedMember = {
      first_name: editingMember.first_name.trim(),
      surname: editingMember.surname.trim(),
      team_name: editingMember.team_name.trim(),
      role: editingMember.role,
      paid: Boolean(editingMember.paid),
    };

    const { error } = await supabase
      .from("profiles")
      .update(updatedMember)
      .eq("id", editingMember.id);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setMembers((current) =>
      current.map((member) =>
        member.id === editingMember.id
          ? { ...member, ...updatedMember }
          : member
      )
    );

    setEditingMember(null);
    setSavingId(null);
    setMessage("Member saved.");
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
          result.error ||
            "Could not delete the member."
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

      setEditingMember(null);
      setMessage(`${displayName} has been deleted.`);
    } catch (error) {
      console.error("Delete member error:", error);

      setMessage(
        "An unexpected error occurred while deleting the member."
      );
    }

    setDeletingId(null);
  }

  function formatJoinedDate(value) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-GB");
  }

  function RoleBadge({ role }) {
    const isAdmin = role === "admin";

    return (
      <span
        className={`role-badge ${
          isAdmin ? "role-admin" : ""
        }`}
      >
        {role || "entrant"}
      </span>
    );
  }

  function Header() {
    return (
      <div className="predictor-header">
        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
        />

        <div>
          <div className="predictor-title">
            THE PREDICTO
            <span>R</span>
          </div>

          <div className="administrator-label">
            ADMINISTRATOR
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main>
        <div
          className="container"
          style={{ maxWidth: "960px" }}
        >
          <Header />

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
        <div
          className="container"
          style={{ maxWidth: "960px" }}
        >
          <Header />

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
      <style>{`
        .predictor-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          margin-bottom: 16px;
        }

        .predictor-header img {
          width: 58px;
          height: auto;
          display: block;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,.35));
        }

        .predictor-title {
          font-size: 27px;
          line-height: .95;
          font-weight: 900;
          letter-spacing: -1.2px;
          color: white;
          white-space: nowrap;
          text-shadow: 0 2px 8px rgba(0,0,0,.35);
        }

        .predictor-title span {
          color: #ed1c24;
          text-shadow: 0 0 12px rgba(237,28,36,.32);
        }

        .administrator-label {
          margin-top: 5px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.4px;
          color: #a9bfd5;
          text-align: left;
        }

        .members-scroll {
          width: 100%;
          max-height: 64vh;
          overflow-y: auto;
          border: 1px solid rgba(169,191,213,.18);
          border-radius: 12px;
          background: rgba(3,12,25,.45);
        }

        .desktop-table {
          display: block;
        }

        .members-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .members-table th {
          position: sticky;
          top: 0;
          z-index: 20;
          padding: 13px 12px;
          background: #0a1727;
          color: #a9bfd5;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .7px;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(169,191,213,.22);
        }

        .members-table td {
          padding: 13px 12px;
          border-bottom: 1px solid rgba(169,191,213,.12);
          color: white;
          vertical-align: middle;
        }

        .members-table tr:last-child td {
          border-bottom: none;
        }

        .members-table tbody tr:hover {
          background: rgba(37,130,255,.08);
        }

        .role-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          text-transform: capitalize;
          background: rgba(169,191,213,.12);
          color: #d7e3ef;
          border: 1px solid rgba(169,191,213,.18);
        }

        .role-badge.role-admin {
          background: rgba(0,108,255,.2);
          color: #5aa7ff;
          border-color: rgba(0,108,255,.35);
        }

        .paid-circle {
          display: inline-flex;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 900;
          color: white;
        }

        .edit-small {
          width: auto !important;
          min-width: 62px;
          padding: 7px 11px !important;
          margin: 0 !important;
          font-size: 12px !important;
          border-radius: 8px !important;
        }

        .mobile-list {
          display: none;
        }

        .member-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(0,0,0,.72);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .member-editor {
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-sizing: border-box;
          padding: 20px;
          border-radius: 18px;
          background: #071422;
          border: 1px solid rgba(44,137,255,.7);
          box-shadow:
            0 0 30px rgba(0,108,255,.22),
            0 0 24px rgba(237,28,36,.15),
            0 18px 50px rgba(0,0,0,.55);
        }

        .member-editor label {
          display: block;
          text-align: left;
          margin-bottom: 14px;
          color: white;
        }

        .member-editor input,
        .member-editor select {
          width: 100%;
          box-sizing: border-box;
          margin-top: 6px;
          padding: 11px;
          border-radius: 9px;
          border: 1px solid rgba(169,191,213,.32);
          background: #0d1d2e;
          color: white;
          font-size: 16px;
        }

        @media (max-width: 700px) {
          .desktop-table {
            display: none;
          }

          .mobile-list {
            display: block;
          }

          .members-scroll {
            max-height: 62vh;
            overflow-x: hidden;
          }

          .mobile-header {
            position: sticky;
            top: 0;
            z-index: 25;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 9px 11px;
            background: #0a1727;
            color: #a9bfd5;
            border-bottom: 1px solid rgba(169,191,213,.22);
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .7px;
          }

          .mobile-member-row {
            display: grid;
            grid-template-columns: minmax(0,1fr) auto;
            gap: 8px;
            align-items: center;
            padding: 10px 11px;
            border-bottom: 1px solid rgba(169,191,213,.13);
          }

          .mobile-member-row:last-child {
            border-bottom: none;
          }

          .mobile-team {
            color: white;
            font-size: 14px;
            line-height: 1.15;
            font-weight: 900;
            margin-bottom: 4px;
          }

          .mobile-player-role {
            display: flex;
            gap: 6px;
            align-items: center;
            flex-wrap: wrap;
            margin-bottom: 4px;
          }

          .mobile-player {
            color: #a9bfd5;
            font-size: 11px;
            font-weight: 700;
          }

          .mobile-paid {
            font-size: 11px;
            font-weight: 900;
          }

          .member-editor {
            max-height: 88vh;
            padding: 17px;
          }
        }
      `}</style>

      <div
        className="container"
        style={{ maxWidth: "960px" }}
      >
        <Header />

        <div
          style={{
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "900",
              color: "#fff",
            }}
          >
            Members
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              fontWeight: "700",
              color: "#a9bfd5",
            }}
          >
            {members.length} Predictor{" "}
            {members.length === 1
              ? "member"
              : "members"}
          </div>
        </div>

        {message && (
          <div
            className="card"
            style={{
              padding: "12px 15px",
              marginBottom: "14px",
            }}
          >
            <p style={{ margin: 0 }}>
              {message}
            </p>
          </div>
        )}

        <div
          className="card"
          style={{ padding: "16px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "13px",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <h2 style={{ marginBottom: "3px" }}>
                Predictor Members
              </h2>

              <div
                style={{
                  fontSize: "12px",
                  color: "#a9bfd5",
                }}
              >
                {filteredMembers.length} shown
              </div>
            </div>

            <input
              type="search"
              placeholder="Search members..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={{
                width: "240px",
                maxWidth: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: "9px",
                border:
                  "1px solid rgba(169,191,213,.28)",
                background: "#0d1d2e",
                color: "#fff",
                fontSize: "14px",
              }}
            />
          </div>

          {filteredMembers.length === 0 ? (
            <p>No members found.</p>
          ) : (
            <div className="members-scroll">

              <div className="desktop-table">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Team Name</th>
                      <th>Role</th>
                      <th style={{ textAlign: "center" }}>
                        Paid
                      </th>
                      <th style={{ textAlign: "center" }}>
                        Edit
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMembers.map((member) => {
                      const fullName =
                        `${member.first_name || ""} ${
                          member.surname || ""
                        }`.trim();

                      return (
                        <tr key={member.id}>
                          <td>
                            <strong>
                              {fullName || "Unnamed"}
                            </strong>
                          </td>

                          <td>
                            {member.team_name || "—"}
                          </td>

                          <td>
                            <RoleBadge
                              role={member.role}
                            />
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                            }}
                          >
                            <span
                              className="paid-circle"
                              style={{
                                background:
                                  member.paid
                                    ? "#1f9d55"
                                    : "#e31b23",
                              }}
                            >
                              {member.paid ? "✓" : "✕"}
                            </span>
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                            }}
                          >
                            <button
                              className="edit-small"
                              onClick={() =>
                                openEditor(member)
                              }
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mobile-list">
                <div className="mobile-header">
                  <span>MEMBER</span>
                  <span>EDIT</span>
                </div>

                {filteredMembers.map((member) => {
                  const fullName =
                    `${member.first_name || ""} ${
                      member.surname || ""
                    }`.trim();

                  return (
                    <div
                      className="mobile-member-row"
                      key={member.id}
                    >
                      <div>
                        <div className="mobile-team">
                          {member.team_name ||
                            "No Team Name"}
                        </div>

                        <div className="mobile-player-role">
                          <span className="mobile-player">
                            {fullName || "Unnamed"}
                          </span>

                          <RoleBadge
                            role={member.role}
                          />
                        </div>

                        <div
                          className="mobile-paid"
                          style={{
                            color: member.paid
                              ? "#55d98a"
                              : "#ff6268",
                          }}
                        >
                          {member.paid
                            ? "✓ PAID"
                            : "✕ UNPAID"}
                        </div>
                      </div>

                      <button
                        className="edit-small"
                        onClick={() =>
                          openEditor(member)
                        }
                      >
                        Edit
                      </button>
                    </div>
                  );
                })}
              </div>

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

      {editingMember && (
        <div
          className="member-overlay"
          onClick={closeEditor}
        >
          <div
            className="member-editor"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "900",
                    color: "#fff",
                  }}
                >
                  Edit Member
                </div>

                <div
                  style={{
                    marginTop: "3px",
                    color: "#a9bfd5",
                    fontSize: "12px",
                  }}
                >
                  {editingMember.team_name}
                </div>
              </div>

              <button
                onClick={closeEditor}
                disabled={
                  savingId === editingMember.id ||
                  deletingId === editingMember.id
                }
                style={{
                  width: "42px",
                  height: "42px",
                  padding: 0,
                  margin: 0,
                  borderRadius: "10px",
                  background: "#536579",
                  fontSize: "20px",
                }}
              >
                ×
              </button>
            </div>

            <label>
              <strong>First Name</strong>

              <input
                type="text"
                value={
                  editingMember.first_name || ""
                }
                onChange={(e) =>
                  updateEditingField(
                    "first_name",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              <strong>Surname</strong>

              <input
                type="text"
                value={
                  editingMember.surname || ""
                }
                onChange={(e) =>
                  updateEditingField(
                    "surname",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              <strong>Team Name</strong>

              <input
                type="text"
                value={
                  editingMember.team_name || ""
                }
                onChange={(e) =>
                  updateEditingField(
                    "team_name",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              <strong>Role</strong>

              <select
                value={
                  editingMember.role || "entrant"
                }
                onChange={(e) =>
                  updateEditingField(
                    "role",
                    e.target.value
                  )
                }
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
                marginBottom: "14px",
                borderRadius: "11px",
                background: editingMember.paid
                  ? "rgba(31,157,85,.12)"
                  : "rgba(227,27,35,.12)",
                border: editingMember.paid
                  ? "1px solid rgba(31,157,85,.55)"
                  : "1px solid rgba(227,27,35,.55)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    textAlign: "left",
                    fontWeight: "900",
                    color: editingMember.paid
                      ? "#55d98a"
                      : "#ff6268",
                  }}
                >
                  {editingMember.paid
                    ? "✓ PAID"
                    : "✕ UNPAID"}
                </div>

                <button
                  onClick={() =>
                    updateEditingField(
                      "paid",
                      !editingMember.paid
                    )
                  }
                  style={{
                    width: "auto",
                    margin: 0,
                    padding: "9px 12px",
                    background: editingMember.paid
                      ? "#6b7280"
                      : "#1f9d55",
                  }}
                >
                  {editingMember.paid
                    ? "Mark Unpaid"
                    : "Mark Paid"}
                </button>
              </div>
            </div>

            <div
              style={{
                padding: "11px 12px",
                marginBottom: "16px",
                borderRadius: "9px",
                background:
                  "rgba(169,191,213,.07)",
                color: "#a9bfd5",
                textAlign: "left",
                fontSize: "12px",
              }}
            >
              Joined:{" "}
              <strong style={{ color: "#fff" }}>
                {formatJoinedDate(
                  editingMember.created_at
                )}
              </strong>
            </div>

            <button
              onClick={saveMember}
              disabled={
                savingId === editingMember.id ||
                deletingId === editingMember.id
              }
            >
              {savingId === editingMember.id
                ? "Saving..."
                : "Save Member"}
            </button>

            <button
              onClick={() =>
                deleteMember(editingMember)
              }
              disabled={
                deletingId === editingMember.id ||
                savingId === editingMember.id ||
                editingMember.id === currentUserId
              }
              style={{
                marginTop: "10px",
                background: "#e31b23",
                color: "#fff",
                opacity:
                  deletingId === editingMember.id ||
                  savingId === editingMember.id ||
                  editingMember.id === currentUserId
                    ? 0.45
                    : 1,
              }}
            >
              {editingMember.id === currentUserId
                ? "Current Admin — Cannot Delete"
                : deletingId === editingMember.id
                ? "Deleting Member..."
                : "Delete Member"}
            </button>

            <button
              onClick={closeEditor}
              disabled={
                savingId === editingMember.id ||
                deletingId === editingMember.id
              }
              style={{
                marginTop: "10px",
                background: "#536579",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
