import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlaceById, clearSelected } from '../redux/slices/placeSlice';
import { FaArrowLeft, FaStar } from 'react-icons/fa';

const PlaceDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, loading } = useSelector((state) => state.places);

  useEffect(() => {
    dispatch(fetchPlaceById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  if (loading) return <div className="flex justify-center py-10">Loading...</div>;
  if (!selectedItem) return <div>Place not found</div>;

  // 🔥 Removed price from display
  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 mb-4">
        <FaArrowLeft /> Back
      </button>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <img src={selectedItem.image || '/default-place.png'} alt={selectedItem.name} className="w-20 h-20 rounded object-cover" />
          <div>
            <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
            <p className="text-gray-500">{selectedItem.city}, {selectedItem.state}, {selectedItem.country}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Detail label="Category" value={selectedItem.category} />
          <Detail label="Address" value={selectedItem.address} />
          <Detail label="Rating" value={selectedItem.rating ? <><FaStar className="inline text-yellow-500" /> {selectedItem.rating}</> : 'N/A'} />
          <Detail label="Status" value={selectedItem.status} />
          <Detail label="Description" value={selectedItem.description} />
        </div>
        {/* ❌ Price removed */}

        {/* Available Guiders and Photographers – will be added later */}
      </div>
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value || 'N/A'}</p>
  </div>
);

export default PlaceDetails;