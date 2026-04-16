"use client";

import { useState } from "react";
import { useJoinGroup } from "../../hooks/useGroups";
import LoadingSpinner from "../common/LoadingSpinner";

const JoinGroup = ({ onClose }) => {
  const [code, setCode] = useState("");
  const joinGroup = useJoinGroup();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await joinGroup.mutateAsync({ code });
      onClose();
    } catch (error) {}
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label htmlFor="code" className="label">Código del Grupo</label>
      <input
        type="text"
        id="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="input"
        placeholder="Ej: ABC123"
        required
      />

      <div className="flex space-x-3 pt-4">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={joinGroup.isPending} className="btn-primary flex-1">
          {joinGroup.isPending ? <LoadingSpinner size="sm" /> : "Unirse"}
        </button>
      </div>
    </form>
  );
};

export default JoinGroup;
