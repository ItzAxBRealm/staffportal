import { Router } from 'express';
import {
    getBookings,
    getBookingById,
    getBookingsByUserEmail,
    createBooking,
    updateBooking,
    deleteBooking,
    getUserBookings,
    checkAvailability
} from '../controllers/meetingRoom.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);
router.route('/').get(getBookings);
router.route('/check-availability').get(checkAvailability);
router.route('/user-bookings').get(getBookingsByUserEmail); 
router.route('/:id').get(getBookingById);
router.route('/user/:userId').get(getUserBookings);
router.route('/').post(createBooking);
router.route('/:id').patch(updateBooking);
router.route('/:id').delete(deleteBooking);

export default router;
