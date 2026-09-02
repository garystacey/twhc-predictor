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
      const playerName =
        `${member.first_name || ""} ${
          member.surname || ""
        }`.toLowerCase();

      const teamName = (
        member.team_name || ""
      ).toLowerCase();

      const role = (
        member.role || ""
      ).toLowerCase();

      return (
        playerName.includes(term) ||
        teamName.includes(term) ||
        role.includes(term)
      );
    });
  }, [members, search]);

  function openEditor(member) {
    setMessage("");

    setEditingMember({
      ...member,
    });
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

    const { error } = await sup
