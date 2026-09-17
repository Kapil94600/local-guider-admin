import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaSave, FaUser } from 'react-icons/fa';
import { createGuider } from '../redux/slices/guiderSlice';

const GuiderCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      data.pricePerHour = parseFloat(data.pricePerHour) || 0;
      data.pricePerDay = parseFloat(data.pricePerDay) || 0;
      const result = await dispatch(createGuider(data));
      if (createGuider.fulfilled.match(result)) {
        toast.success('Guider created successfully!');
        navigate('/guiders');
      } else {
        toast.error(result.payload || 'Failed to create guider');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/guiders')}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <FaArrowLeft className="text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Add New Guider</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 space-y-6">
        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User *</label>
          <select
            {...register('userId', { required: 'User is required' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select User</option>
            {/* Populate this from API when component mounts */}
            <option value="user1">User 1</option>
            <option value="user2">User 2</option>
          </select>
          {errors.userId && <p className="text-red-500 text-sm mt-1">{errors.userId.message}</p>}
        </div>

        {/* Place Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Place *</label>
          <select
            {...register('placeId', { required: 'Place is required' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Place</option>
            {/* Populate this from API when component mounts */}
            <option value="place1">Place 1</option>
            <option value="place2">Place 2</option>
          </select>
          {errors.placeId && <p className="text-red-500 text-sm mt-1">{errors.placeId.message}</p>}
        </div>

        {/* Experience, Languages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years) *</label>
            <input
              type="number"
              min="0"
              {...register('experience', { required: 'Experience is required', min: 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 5"
            />
            {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
            <input
              {...register('languages')}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. English, Hindi"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            {...register('bio')}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            placeholder="About the guider..."
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Hour ($) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              {...register('pricePerHour', { required: 'Hourly price is required', min: 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 25"
            />
            {errors.pricePerHour && <p className="text-red-500 text-sm mt-1">{errors.pricePerHour.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Day ($) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              {...register('pricePerDay', { required: 'Daily price is required', min: 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 150"
            />
            {errors.pricePerDay && <p className="text-red-500 text-sm mt-1">{errors.pricePerDay.message}</p>}
          </div>
        </div>

        {/* Profile Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
          <div className="flex items-center gap-4">
            <input
              {...register('image')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              placeholder="https://example.com/avatar.jpg"
            />
            <div className="p-3 bg-gray-100 rounded-xl text-gray-500">
              <FaUser size={20} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/guiders')}
            className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-70"
          >
            {loading ? 'Creating...' : <><FaSave /> Create Guider</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GuiderCreate;