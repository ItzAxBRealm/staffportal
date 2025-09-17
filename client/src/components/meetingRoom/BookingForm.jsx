import { useState } from 'react';
import { z } from 'zod';
import Checkbox from '../ui/Checkbox';
import FormInput from '../ui/FormInput';
import Spinner from '../ui/Spinner';

const bookingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required'),
  equipment: z.string().optional(),
  zoomMeeting: z.boolean().optional(),
  laptopNeeded: z.boolean().optional(),
  recurring: z.boolean().optional(),
  recurringType: z.enum(['weekly', 'fortnightly']).optional(),
  recurringWeeks: z.coerce.number().min(1).max(8).optional(),
});

const BookingForm = ({ selectedSlot = null, selectedSlots = [], onSubmit }) => {
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    equipment: '',
    zoomMeeting: false,
    laptopNeeded: false,
    recurring: false,
    recurringType: 'weekly',
    recurringWeeks: 1,
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev, [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = bookingSchema.safeParse(formData);
    if (!result.success) {
      const errors = {};
      result.error.errors.forEach(err => {
        if (err.path && err.path.length > 0) {
          errors[err.path[0]] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    setIsSubmitting(true);
    const resetForm = () => {
      setFormData({
        title: '',
        equipment: '',
        zoomMeeting: false,
        laptopNeeded: false,
        recurring: false,
        recurringType: 'weekly',
        recurringWeeks: 1,
      });
      setFormErrors({});
    };

    try {
      await onSubmit(formData, { setSubmitting: setIsSubmitting, resetForm });
    } 
    catch (error) {
      console.error('Form submission error:', error);
    } 
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="booking-form-container">
      {selectedSlots && selectedSlots.length > 0 ? (
        <div className="mb-6">
          <div className="p-3 bg-[#52FFB8]/30 rounded-md border border-blue-100 mb-3">
            <p className="text-sm text-[#3C787E] font-medium">Selected Time Slots ({selectedSlots.length})</p>
            <div className="mt-2 max-h-40 overflow-y-auto">
              {selectedSlots.map((slot, index) => (
                <div key={index} className="text-sm text-gray-700 mb-1 flex items-center">
                  <span className="inline-block w-6 h-6 rounded-full bg-[#02020A] text-white text-xs p-2 items-center justify-center mr-2">
                    {index + 1}
                  </span>
                  {formatDate(slot.start)} to {formatTime(slot.end)}
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-500 italic">
            * Click on available times to select/deselect multiple booking slots
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-[#EB5E55] rounded-md border border-cyan-100">
          <p className="text-sm text-white">
            Please select one or more time slots on the calendar.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Meeting Title"
              type="text"
              name="title"
              placeholder="Team Meeting, Project Discussion, etc."
              value={formData.title}
              onChange={handleInputChange}
              error={formErrors.title}
            />

            <div className="space-y-3">
              <div className="mb-4">
                <Checkbox 
                  name="zoomMeeting" 
                  id="zoomMeeting" 
                  label="Is it a Zoom meeting?" 
                  checked={formData.zoomMeeting}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="mb-4">
                <Checkbox 
                  name="laptopNeeded" 
                  id="laptopNeeded" 
                  label="Is a Laptop needed?" 
                  checked={formData.laptopNeeded}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mb-4">
                <Checkbox 
                  name="recurring" 
                  id="recurring" 
                  label="Make this a recurring booking?" 
                  checked={formData.recurring}
                  onChange={handleInputChange}
                />
              </div>

              {formData.recurring && (
                <div className="mb-4 pl-6 border-l-2 border-gray-200 space-y-3">
                  <div className="flex flex-col space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Recurring Type</label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input 
                          type="radio" 
                          name="recurringType" 
                          value="weekly"
                          checked={formData.recurringType === 'weekly'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-[#3C787E] cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-gray-700">Weekly</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input 
                          type="radio" 
                          name="recurringType" 
                          value="fortnightly"
                          checked={formData.recurringType === 'fortnightly'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-[#3C787E] cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-gray-700">Fortnightly</span>
                      </label>
                    </div>
                  </div>

                  <FormInput
                    label={formData.recurringType === 'weekly' ? 'Number of Weeks' : 'Number of Occurrences'}
                    as="select"
                    name="recurringWeeks"
                    value={formData.recurringWeeks}
                    onChange={handleInputChange}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num} className='cursor-pointer'>
                        {num} {num === 1 ? 
                          (formData.recurringType === 'weekly' ? 'week' : 'occurrence') : 
                          (formData.recurringType === 'weekly' ? 'weeks' : 'occurrences')}
                      </option>
                    ))}
                  </FormInput>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.recurringType === 'weekly' 
                      ? 'Booking will repeat weekly for this many weeks' 
                      : 'Booking will repeat every two weeks for this many occurrences'}
                  </p>
                </div>
              )}
            </div>

            <FormInput
              label="Additional Requirements"
              as="textarea"
              name="equipment"
              placeholder="Projector, Whiteboard, Zoom setup, etc."
              rows={3}
              value={formData.equipment}
              onChange={handleInputChange}
              error={formErrors.equipment}
            />

            <div className="pt-2">
               {isSubmitting ? (
                <div className='w-full flex items-center justify-center'>
                  <Spinner />
                </div>
               ) : (
                <button 
                className={`w-full booking-submit-button ${selectedSlots.length === 0 ? 'opacity-50' : ''} font-medium py-2 px-4 rounded-md text-sm cursor-pointer`}
                type="submit" 
                disabled={selectedSlots.length === 0}
                >
                    {selectedSlots.length === 0 
                      ? 'Select time slot first' 
                      : selectedSlots.length > 1 || formData.recurring 
                        ? 'Book selected time slots' 
                        : 'Book this time slot'
                    }
                </button>
               )}
            </div>
      </form>
    </div>
  );
};

export default BookingForm;