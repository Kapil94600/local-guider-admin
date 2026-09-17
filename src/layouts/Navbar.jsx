import { useSelector } from 'react-redux';
import { FaUserCircle } from 'react-icons/fa';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="bg-white shadow-sm px-4 md:px-6 py-3 flex justify-between items-center">
      <div className="text-xl font-semibold">Dashboard</div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700">{user?.name || 'Admin'}</span>
        <FaUserCircle size={32} className="text-gray-500" />
      </div>
    </header>
  );
};

export default Navbar;