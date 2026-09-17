export const Table = ({ children }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">{children}</table>
  </div>
);

export const TableHeader = ({ children }) => (
  <thead className="bg-gray-50">{children}</thead>
);

export const TableBody = ({ children }) => (
  <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
);

export const TableRow = ({ children }) => (
  <tr>{children}</tr>
);

export const TableCell = ({ children, as = 'td', ...props }) => {
  const Component = as;
  return <Component className="px-4 py-3 text-sm" {...props}>{children}</Component>;
};

export const TablePagination = ({ count, page, rowsPerPage, onPageChange, onRowsPerPageChange }) => (
  <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
    <div className="flex items-center gap-2">
      <span className="text-sm">Rows per page:</span>
      <select
        value={rowsPerPage}
        onChange={onRowsPerPageChange}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm">
        {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, count)} of {count}
      </span>
      <button
        onClick={() => onPageChange(null, page - 1)}
        disabled={page === 0}
        className="p-1 rounded border disabled:opacity-50"
      >
        Previous
      </button>
      <button
        onClick={() => onPageChange(null, page + 1)}
        disabled={(page + 1) * rowsPerPage >= count}
        className="p-1 rounded border disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
);

export const SearchInput = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="border rounded-lg px-3 py-2 w-48 focus:ring-2 focus:ring-indigo-500"
  />
);