import { Router } from "express";
import { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    getAllUsers,
    toggleAdminStatus,
    deleteUser,
    getUserCount,
    requestPasswordReset,
    resetPassword,
    getAllAdmins,
    testEmailConfig,
    searchUsers,
    updatePhoneNumber
} from "../controllers/user.controller.js";
import { verifyJWT, hasAdminPermissions, isSystemAdmin } from "../middlewares/auth.middleware.js";
// import { allowOnlyIfNoAdminExists } from "../middlewares/conditionalAuth.middleware.js";

const router = Router();

router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/register", registerUser);

router.use(verifyJWT); 

router.post("/logout", logoutUser);
router.get("/current-user", getCurrentUser);
router.patch("/change-password", changeCurrentPassword);
router.patch("/update-profile", updateAccountDetails);
router.patch("/update-phone", updatePhoneNumber);

router.get("/search", searchUsers);

router.get("/all", verifyJWT, hasAdminPermissions, getAllUsers);
router.get("/admins", verifyJWT, hasAdminPermissions, getAllAdmins);
router.post("/create-user", verifyJWT, hasAdminPermissions, registerUser);
router.post("/toggle-admin/:userId", verifyJWT, isSystemAdmin, toggleAdminStatus);
router.delete("/admin/users/:userId", verifyJWT, isSystemAdmin, deleteUser);
router.get("/count", getUserCount);
router.post("/test-email", verifyJWT, hasAdminPermissions, testEmailConfig);

export default router;
