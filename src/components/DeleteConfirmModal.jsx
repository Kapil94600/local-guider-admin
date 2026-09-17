import { FaTimes } from 'react-icons/fa';

export const DeleteConfirmModal = ({ open, onClose, onConfirm, id }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Confirm Delete</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <FaTimes />
          </button>
        </div>
        <p className="mb-4">Are you sure you want to delete this item?</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => onConfirm(id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
};