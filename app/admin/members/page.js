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
          isAdmin ? "role-admin" : "role-entrant"
        }`}
      >
        {isAdmin ? "ADMIN" : "ENTRANT"}
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
            THE PREDICTO<span>R</span>
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
        <div className="container" style={{ maxWidth: "960px" }}>
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
        <div className="container" style={{ maxWidth: "960px" }}>
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
          filter:
            drop-shadow(0 0 8px rgba(0,120,255,.28))
            drop-shadow(0 4px 8px rgba(0,0,0,.4));
        }

        .predictor-title {
          font-size: 27px;
          line-height: .95;
          font-weight: 900;
          letter-spacing: -1.2px;
          color: #ffffff;
          white-space: nowrap;
          text-shadow:
            0 2px 8px rgba(0,0,0,.45),
            0 0 12px rgba(255,255,255,.08);
        }

        .predictor-title span {
          color: #ed1c24;
          text-shadow: 0 0 12px rgba(237,28,36,.42);
        }

        .administrator-label {
          margin-top: 5px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.8px;
          color: #a9bfd5;
          text-align: left;
        }

        .members-card {
          position: relative;
          overflow: hidden;
          padding: 16px !important;
          border:
            1px solid rgba(80,150,230,.28) !important;
          background:
            linear-gradient(
              145deg,
              rgba(8,26,45,.98),
              rgba(3,13,26,.98)
            ) !important;
          box-shadow:
            -4px 0 15px rgba(0,105,255,.12),
            4px 0 15px rgba(237,28,36,.10),
            0 14px 35px rgba(0,0,0,.32) !important;
        }

        .members-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 50%;
          height: 3px;
          background:
            linear-gradient(
              90deg,
              #006cff,
              #39a7ff,
              transparent
            );
        }

        .members-card::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          left: 50%;
          height: 3px;
          background:
            linear-gradient(
              270deg,
              #ed1c24,
              #ff3b45,
              transparent
            );
        }

        .members-heading {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -.6px;
          color: #ffffff;
          margin-bottom: 2px;
          text-shadow: 0 2px 8px rgba(0,0,0,.3);
        }

        .members-count {
          font-size: 12px;
          font-weight: 800;
          color: #84a6c6;
        }

        .members-search {
          width: 240px;
          max-width: 100%;
          box-sizing: border-box;
          padding: 11px 13px;
          border-radius: 10px;
          border: 1px solid rgba(64,151,255,.48);
          background:
            linear-gradient(
              145deg,
              #081a2b,
              #071523
            );
          color: #ffffff;
          font-size: 14px;
          box-shadow:
            inset 0 0 14px rgba(0,0,0,.18),
            0 0 10px rgba(0,108,255,.07);
        }

        .members-search::placeholder {
          color: #7f9ab4;
        }

        .members-search:focus {
          outline: none;
          border-color: #2690ff;
          box-shadow:
            0 0 0 2px rgba(38,144,255,.15),
            0 0 14px rgba(38,144,255,.16);
        }

        .members-scroll {
          width: 100%;
          max-height: 55vh;
          overflow-y: auto;
          overflow-x: hidden;
          border: 1px solid rgba(74,141,212,.28);
          border-radius: 12px;
          background:
            linear-gradient(
              180deg,
              #071624 0%,
              #06121f 100%
            );
          box-shadow:
            inset 0 0 18px rgba(0,0,0,.32);
        }

        .members-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .members-scroll::-webkit-scrollbar-track {
          background: #05111d;
        }

        .members-scroll::-webkit-scrollbar-thumb {
          background:
            linear-gradient(
              #1d8cff,
              #ed1c24
            );
          border-radius: 10px;
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
          background:
            linear-gradient(
              180deg,
              #0c2238,
              #091a2b
            );
          color: #9db9d4;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .8px;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(74,141,212,.32);
          box-shadow: 0 3px 10px rgba(0,0,0,.28);
        }

        .members-table td {
          padding: 13px 12px;
          border-bottom:
            1px solid rgba(95,137,176,.12);
          color: white;
          vertical-align: middle;
        }

        .members-table tbody tr:nth-child(odd) {
          background: rgba(16,43,68,.34);
        }

        .members-table tbody tr:nth-child(even) {
          background: rgba(5,21,36,.58);
        }

        .members-table tbody tr:hover {
          background: rgba(0,110,255,.12);
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 62px;
          padding: 5px 7px;
          box-sizing: border-box;
          border-radius: 7px;
          font-size: 9px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: .25px;
          white-space: nowrap;
        }

        .role-admin {
          background:
            linear-gradient(
              180deg,
              #168eff,
              #0866c3
            );
          color: #ffffff;
          border: 1px solid #4fb0ff;
          box-shadow:
            0 0 9px rgba(0,126,255,.28),
            inset 0 1px 0 rgba(255,255,255,.22);
          text-shadow: 0 1px 2px rgba(0,0,0,.45);
        }

        .role-entrant {
          background:
            linear-gradient(
              180deg,
              #40566b,
              #2d3d4d
            );
          color: #ffffff;
          border: 1px solid #5e778f;
          text-shadow: 0 1px 2px rgba(0,0,0,.4);
        }

        .paid-circle {
          display: inline-flex;
          width: 27px;
          height: 27px;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 900;
          color: white;
        }

        .paid-yes {
          background:
            linear-gradient(
              180deg,
              #26c66b,
              #138346
            );
          box-shadow: 0 0 10px rgba(38,198,107,.27);
        }

        .paid-no {
          background:
            linear-gradient(
              180deg,
              #ff424b,
              #c91822
            );
          box-shadow: 0 0 10px rgba(237,28,36,.25);
        }

        .edit-small {
          width: auto !important;
          min-width: 58px;
          padding: 7px 10px !important;
          margin: 0 !important;
          font-size: 12px !important;
          font-weight: 900 !important;
          border-radius: 8px !important;
          border: 1px solid #35a5ff !important;
          background:
            linear-gradient(
              180deg,
              #1597ff,
              #0871cd
            ) !important;
          color: white !important;
          box-shadow:
            0 3px 0 #04518f,
            0 0 8px rgba(0,130,255,.22) !important;
        }

        .edit-small:active {
          transform: translateY(2px);
          box-shadow:
            0 1px 0 #04518f !important;
        }

        .mobile-list {
          display: none;
        }

        .back-admin-button {
          margin-top: 13px !important;
          background:
            linear-gradient(
              110deg,
              #076ccd,
              #123c78 55%,
              #9a1822
            ) !important;
          border: 1px solid rgba(64,156,255,.5) !important;
          box-shadow:
            0 3px 0 #032e58,
            0 0 11px rgba(0,108,255,.14) !important;
        }

        .member-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(0,0,0,.76);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          backdrop-filter: blur(3px);
        }

        .member-editor {
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-sizing: border-box;
          padding: 20px;
          border-radius: 18px;
          background:
            linear-gradient(
              145deg,
              #0a2035,
              #061320
            );
          border: 1px solid rgba(44,137,255,.75);
          box-shadow:
            -6px 0 24px rgba(0,108,255,.17),
            6px 0 24px rgba(237,28,36,.12),
            0 18px 50px rgba(0,0,0,.62);
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
          border: 1px solid rgba(82,146,207,.42);
          background: #071725;
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

          .members-card {
            padding: 13px !important;
          }

          .members-heading {
            font-size: 21px;
          }

          .members-search {
            width: 100%;
          }

          .members-scroll {
            max-height: 45vh;
          }

          .mobile-header {
            position: sticky;
            top: 0;
            z-index: 25;
            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              64px
              40px
              58px;
            gap: 5px;
            align-items: center;
            padding: 10px 9px;
            background:
              linear-gradient(
                180deg,
                #0d2740,
                #081a2b
              );
            border-bottom:
              1px solid rgba(75,153,227,.36);
            box-shadow: 0 3px 10px rgba(0,0,0,.3);
            color: #a9c5df;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: .55px;
          }

          .mobile-header span:nth-child(2),
          .mobile-header span:nth-child(3),
          .mobile-header span:nth-child(4) {
            text-align: center;
          }

          .mobile-member-row {
            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              64px
              40px
              58px;
            gap: 5px;
            align-items: center;
            min-height: 59px;
            padding: 9px;
            border-bottom:
              1px solid rgba(95,143,188,.15);
            box-sizing: border-box;
          }

          .mobile-member-row:nth-child(even) {
            background:
              linear-gradient(
                90deg,
                rgba(0,95,190,.075),
                rgba(255,255,255,.015)
              );
          }

          .mobile-member-row:nth-child(odd) {
            background:
              linear-gradient(
                90deg,
                rgba(255,255,255,.018),
                rgba(175,18,31,.055)
              );
          }

          .mobile-person {
            min-width: 0;
            text-align: left;
          }

          .mobile-team {
            color: #ffffff;
            font-size: 13px;
            line-height: 1.15;
            font-weight: 900;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-shadow: 0 1px 3px rgba(0,0,0,.6);
          }

          .mobile-player {
            margin-top: 4px;
            color: #8fa9c1;
            font-size: 10px;
            line-height: 1.1;
            font-weight: 800;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .mobile-role {
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .mobile-paid {
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .mobile-edit {
            display: flex;
            justify-content: flex-end;
            align-items: center;
          }

          .member-editor {
            max-height: 86vh;
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
            marginBottom: "14px",
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
              marginBottom: "12px",
            }}
          >
            <p style={{ margin: 0 }}>
              {message}
            </p>
          </div>
        )}

        <div className="card members-card">
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
              <div className="members-heading">
                Predictor Members
              </div>

              <div className="members-count">
                {filteredMembers.length} shown
              </div>
            </div>

            <input
              className="members-search"
              type="search"
              placeholder="Search members..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
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

                          <td style={{ textAlign: "center" }}>
                            <span
                              className={`paid-circle ${
                                member.paid
                                  ? "paid-yes"
                                  : "paid-no"
                              }`}
                            >
                              {member.paid ? "✓" : "✕"}
                            </span>
                          </td>

                          <td style={{ textAlign: "center" }}>
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
                  <span>TEAM / PLAYER</span>
                  <span>ROLE</span>
                  <span>PAID</span>
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
                      <div className="mobile-person">
                        <div className="mobile-team">
                          {member.team_name ||
                            "No Team Name"}
                        </div>

                        <div className="mobile-player">
                          {fullName || "Unnamed"}
                        </div>
                      </div>

                      <div className="mobile-role">
                        <RoleBadge
                          role={member.role}
                        />
                      </div>

                      <div className="mobile-paid">
                        <span
                          className={`paid-circle ${
                            member.paid
                              ? "paid-yes"
                              : "paid-no"
                          }`}
                        >
                          {member.paid ? "✓" : "✕"}
                        </span>
                      </div>

                      <div className="mobile-edit">
                        <button
                          className="edit-small"
                          onClick={() =>
                            openEditor(member)
                          }
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <a href="/admin">
          <button className="back-admin-button">
            ← Back to Admin
          </button>
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
