import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

export const StatusUpdateModal = ({ open, onClose, onConfirm, id, currentStatus }) => {
  const [status, setStatus] = useState(currentStatus || '');

  if (!open) return null;

  const handleConfirm = () => {
    if (status) {
      onConfirm(id, status);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Update Status</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <FaTimes />
          </button>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        >
          <option value="">Select Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="pending">Pending</option>
        </select>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Update</button>
        </div>
      </div>
    </div>
  );
};