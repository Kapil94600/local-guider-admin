// src/components/StatusUpdateModal.jsx
import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

// ═══════════════════════════════════════════════════════════════
// STATUS OPTIONS
// ═══════════════════════════════════════════════════════════════
const STATUS_OPTIONS = [
  {
    value: "true",
    label: "Active",
    description: "User can access the platform",
  },
  {
    value: "false",
    label: "Inactive",
    description: "User cannot access the platform",
  },
];

export const StatusUpdateModal = ({
  open,
  onClose,
  onConfirm,
  id,
  currentStatus,
}) => {
  // ✅ FIX B-6: Derive initial value
  const getInitialStatus = (status) => {
    if (typeof status === "boolean") return String(status);
    return "";
  };

  const [status, setStatus] = useState(getInitialStatus(currentStatus));
  const [loading, setLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // ✅ FIX B-6: Sync status with currentStatus whenever modal opens
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (open) {
      // Reset only when modal opens or id/status changes
      setStatus(getInitialStatus(currentStatus));
      setLoading(false);
    }
  }, [open, id, currentStatus]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (status === "") {
      return;
    }
    const isActive = status === "true";
    setLoading(true);
    try {
      await onConfirm(id, isActive);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Update Status
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={loading}
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-2 mb-6">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                status === option.value
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              disabled={loading}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {option.description}
                  </div>
                </div>
                {status === option.value && (
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || status === ""}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
};