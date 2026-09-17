// src/components/EntityList.jsx
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  SearchInput,
} from './TableComponents';
import { LoadingSkeleton } from './LoadingSkeleton';
import { StatusUpdateModal } from './StatusUpdateModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export const EntityList = ({
  title,
  fetchAction,
  deleteAction,
  updateStatusAction,
  setPageAction,
  setLimitAction,
  pagination,
  items,
  total,
  loading,
  columns,
  statusField = 'status',
  idField = 'id',
  showStatusUpdate = true,
  showDelete = true,
  showView = true,
  viewPath = '', // optional base path for view details
  extraActions = [],
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusModal, setStatusModal] = useState({ open: false, id: null, currentStatus: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  useEffect(() => {
    const params = { page: pagination.page, limit: pagination.limit, search };
    dispatch(fetchAction(params));
  }, [dispatch, fetchAction, pagination.page, pagination.limit, search]);

  const handlePageChange = (newPage) => {
    dispatch(setPageAction(newPage + 1));
  };

  const handleLimitChange = (newLimit) => {
    dispatch(setLimitAction(newLimit));
    dispatch(setPageAction(1));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    dispatch(setPageAction(1));
  };

  const handleStatusUpdate = (id, newStatus) => {
    dispatch(updateStatusAction({ id, status: newStatus }));
    setStatusModal({ open: false, id: null, currentStatus: '' });
  };

  const handleDelete = (id) => {
    dispatch(deleteAction(id));
    setDeleteModal({ open: false, id: null });
  };

  const openStatusModal = (id, currentStatus) => {
    setStatusModal({ open: true, id, currentStatus });
  };

  const openDeleteModal = (id) => {
    setDeleteModal({ open: true, id });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={handleSearch} placeholder="Search..." />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <LoadingSkeleton rows={5} cols={columns.length + 1} />
        ) : (
          <>
            <Table>
              <TableHeader>
                {columns.map((col) => (
                  <TableCell key={col.key} as="th">{col.label}</TableCell>
                ))}
                <TableCell as="th">Actions</TableCell>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item[idField]}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render ? col.render(item) : item[col.key]}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex gap-2">
                        {extraActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => action.onClick(item)}
                            className="p-1 rounded hover:bg-gray-100"
                            title={action.label}
                          >
                            {action.icon}
                          </button>
                        ))}
                        {showView && (
                          <button
                            onClick={() => navigate(`/${viewPath}/${item[idField]}`)}
                            className="p-1 rounded hover:bg-gray-100 text-blue-600"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                        )}
                        {showStatusUpdate && (
                          <button
                            onClick={() => openStatusModal(item[idField], item[statusField])}
                            className="p-1 rounded hover:bg-gray-100 text-yellow-600"
                            title="Update Status"
                          >
                            <FaEdit />
                          </button>
                        )}
                        {showDelete && (
                          <button
                            onClick={() => openDeleteModal(item[idField])}
                            className="p-1 rounded hover:bg-gray-100 text-red-600"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              count={total}
              page={pagination.page - 1}
              rowsPerPage={pagination.limit}
              onPageChange={(e, p) => handlePageChange(p)}
              onRowsPerPageChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
            />
          </>
        )}
      </div>

      <StatusUpdateModal
        open={statusModal.open}
        onClose={() => setStatusModal({ open: false, id: null, currentStatus: '' })}
        onConfirm={handleStatusUpdate}
        id={statusModal.id}
        currentStatus={statusModal.currentStatus}
      />
      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDelete}
        id={deleteModal.id}
      />
    </div>
  );
};