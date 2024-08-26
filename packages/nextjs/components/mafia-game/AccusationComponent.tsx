import React, { useState } from "react";

interface AccusationComponentProps {
  connectedAddress: string;
  accuseAddress: string;
  setAccuseAddress: React.Dispatch<React.SetStateAction<string>>;
  handleAccuse: (reason: string) => void;
  hasAccused: { [key: string]: boolean };
}

const AccusationComponent: React.FC<AccusationComponentProps> = ({
  connectedAddress,
  accuseAddress,
  setAccuseAddress,
  handleAccuse,
  hasAccused,
}) => {
  const [reason, setReason] = useState<string>("");

  const onAccuseClick = () => {
    handleAccuse(reason); // Pass the reason to the handleAccuse function
    setAccuseAddress(""); // Clear the accused address input
    setReason(""); // Clear the reason input after accusation
  };

  return (
    <div className="mb-4 p-4 border rounded-lg bg-white shadow-lg w-full max-w-3xl flex flex-col space-y-6">
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
      </div>
      <textarea
        placeholder="Explain your reason for the accusation"
        value={reason}
        onChange={e => setReason(e.target.value)}
        className="textarea textarea-bordered rounded-md w-full"
        disabled={hasAccused[connectedAddress]}
      />
      <button
        onClick={onAccuseClick}
        className={`btn rounded-md btn-primary ${hasAccused[connectedAddress] ? "btn-disabled" : ""}`}
        disabled={hasAccused[connectedAddress]}
      >
        Accuse
      </button>
    </div>
  );
};

export default AccusationComponent;
