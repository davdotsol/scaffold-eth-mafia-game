import React, { useState } from "react";

const CurrentPlayerInfo = ({
  currentPlayer,
  phase,
  handleInvestigate,
  handleSave,
  handleTarget,
  investigateAddress,
  setInvestigateAddress,
  saveAddress,
  setSaveAddress,
  targetAddress,
  setTargetAddress,
}) => {
  return (
    <div className="mb-4 p-4 border rounded-md">
      <h2 className="text-xl font-semibold text-primary-lighter">Current Player</h2>
      <p>Address: {currentPlayer.addr}</p>
      <p>Role: {currentPlayer.role}</p>
      <p>Status: {currentPlayer.alive ? "Alive" : "Dead"}</p>
      {currentPlayer.role === "Detective" && currentPlayer.alive && (
        <div className="mt-4 flex space-x-2">
          <input
            type="text"
            placeholder="Enter address to investigate"
            value={investigateAddress}
            onChange={e => setInvestigateAddress(e.target.value)}
            className="input input-bordered rounded-md w-full"
          />
          <button onClick={handleInvestigate} className="btn rounded-md btn-primary">
            Investigate
          </button>
        </div>
      )}
      {currentPlayer.role === "Doctor" && currentPlayer.alive && (
        <div className="mt-4 flex space-x-2">
          <input
            type="text"
            placeholder="Enter address to save"
            value={saveAddress}
            onChange={e => setSaveAddress(e.target.value)}
            className="input input-bordered rounded-md w-full"
          />
          <button onClick={handleSave} className="btn rounded-md btn-primary">
            Save
          </button>
        </div>
      )}
      {currentPlayer.role === "Mafia" && currentPlayer.alive && (
        <div className="mt-4 flex space-x-2">
          <input
            type="text"
            placeholder="Enter address to target"
            value={targetAddress}
            onChange={e => setTargetAddress(e.target.value)}
            className="input input-bordered rounded-md w-full"
          />
          <button onClick={handleTarget} className="btn rounded-md btn-primary">
            Target
          </button>
        </div>
      )}
    </div>
  );
};

export default CurrentPlayerInfo;
