import React from "react";

const AccusationComponent = ({ connectedAddress, accuseAddress, setAccuseAddress, handleAccuse, hasAccused }) => {
  return (
    <div className="mb-4 p-4 border rounded-md w-full max-w-lg flex flex-col space-y-4">
      <h2 className="text-xl font-semibold text-primary-lighter">Accuse a Player</h2>
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Enter address to accuse"
          value={accuseAddress}
          onChange={e => setAccuseAddress(e.target.value)}
          className="input input-bordered rounded-md w-full"
          disabled={hasAccused[connectedAddress]}
        />
        <button
          onClick={handleAccuse}
          className={`btn rounded-md btn-primary ${hasAccused[connectedAddress] ? "btn-disabled" : ""}`}
        >
          Accuse
        </button>
      </div>
    </div>
  );
};

export default AccusationComponent;
