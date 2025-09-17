import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.models.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import * as emailNotifier from '../utils/emailNotifier.js';

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } 
    catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token.")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password, phoneNumber, jobRole } = req.body
    const missingFields = [];
    
    if (!fullName?.trim()) missingFields.push('Full Name');
    if (!email?.trim()) missingFields.push('Email');
    if (!username?.trim()) missingFields.push('Username');
    if (!password?.trim()) missingFields.push('Password');
    if (!jobRole?.trim()) missingFields.push('Job Role');
    
    if (missingFields.length > 0) {
        throw new ApiError(400, `The following fields are required: ${missingFields.join(', ')}`)
    }
    
    if (phoneNumber?.trim()) {
        const phoneRegex = /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;
        if (!phoneRegex.test(phoneNumber.trim())) {
            throw new ApiError(400, "Please enter a valid Australian phone number (e.g. 0412 345 678 or +61412345678)");
        }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format. Please provide a valid email address.")
    }
    
    if (password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters long")
    }
    
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
        throw new ApiError(400, "Password must contain at least one letter and one number")
    }

    try {
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            throw new ApiError(409, "Email already registered. Please use a different email address.")
        }
        
        const existingUsername = await User.findOne({ username: username.toLowerCase() })
        if (existingUsername) {
            throw new ApiError(409, "Username already taken. Please choose a different username.")
        }
        
        const user = await User.create({
            fullName,
            email,
            password,
            username: username.toLowerCase(),
            phoneNumber: phoneNumber?.trim() || undefined,
            jobRole,
        })
        
        const createdUser = await User.findById(user._id).select("-password -refreshToken")
        
        if(!createdUser){
            throw new ApiError(500, "User creation failed in the database. Please try again.")
        }
        
        return res.status(201).json(
            new ApiResponse(201, createdUser, "User registered successfully")
        )
        
    } 
    catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        console.error("Registration error:", error);
        throw new ApiError(500, `Registration failed: ${error.message || "Unknown error occurred"}`)
    }
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    
    if(!email || !password){
        throw new ApiError(400, "Email and password are required")
    }

    const user = await User.findOne({
        email: { $regex: new RegExp('^' + email + '$', 'i') }
    })

    if (!user){
        throw new ApiError(401, "Invalid credentials")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken")

    const cookieOptions = { 
        httpOnly: true,          
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',     
        maxAge: 7 * 24 * 60 * 60 * 1000  
    }
    
    return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }

    return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"))
})

const sendPasswordResetEmail = async (user, resetToken) => {
    try {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        
        const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
        
        const emailData = {
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <h2>Password Reset Request</h2>
                <p>Hi ${user.fullName},</p>
                <p>You requested a password reset. Click the button below to set a new password:</p>
                <p>
                    <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                        Reset Password
                    </a>
                </p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>This link will expire in 1 hour.</p>
            `
        };
        
        const result = await emailNotifier.sendEmail(emailData);
        
        if (!result?.success) {
            console.error('Failed to send password reset email:', result?.error || 'Unknown error');
            console.log('Would have sent reset link to:', user.email);
            console.log('Reset URL would be:', resetUrl);
        } 
        else {
            console.log('Password reset email sent successfully to:', user.email);
        }
        
        return result || { success: false, error: 'No email result returned' };
    } 
    catch (error) {
        console.error('Exception in sendPasswordResetEmail:', error);
        return { success: false, error: error.message, exception: true };
    }
};    

export const requestPasswordReset = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json(
                new ApiResponse(400, {}, "Email is required")
            );
        }

        const user = await User.findOne({
            email: { $regex: new RegExp('^' + email + '$', 'i') }
        }).catch(err => {
            console.error('Error finding user:', err);
            return null;
        });

        if (!user) {
            console.log(`Password reset requested for non-existent email: ${email}`);
            return res.status(200).json(
                new ApiResponse(200, {}, "If your email exists in our system, you'll receive a password reset link")
            );
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; 

        await user.save({ validateBeforeSave: false }).catch(err => {
            console.error('Error saving user reset token:', err);
        });

        try {
            const emailResult = await sendPasswordResetEmail(user, resetToken);
            if (emailResult && !emailResult.success) {
                console.error(`Failed to send password reset email to ${user.email}:`, emailResult.error);
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Email error details:', JSON.stringify(emailResult, null, 2));
                }
            }
        } 
        catch (emailError) {
            console.error('Error in password reset email process:', emailError);
        }

        return res.status(200).json(
            new ApiResponse(200, {}, "If your email exists in our system, you'll receive a password reset link")
        );
    } 
    catch (error) {
        console.error('Unexpected error in password reset flow:', error);
        return res.status(200).json(
            new ApiResponse(200, {}, "If your email exists in our system, you'll receive a password reset link")
        );
    }
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        throw new ApiError(400, "Token and new password are required");
    }

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired token");
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword)) {
        throw new ApiError(400, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await User.updateOne(
        { _id: user._id },
        { 
            $set: { 
                password: hashedPassword,
                resetPasswordToken: undefined,
                resetPasswordExpires: undefined,
                refreshToken: null
            } 
        }
    );

    if (result.modifiedCount !== 1) {
        throw new ApiError(500, "Failed to update password");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Password has been reset successfully")
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized: No refresh token provided")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401, "Invalid refresh token: User not found")
        }
        
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Invalid or expired token")
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        }

        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(
            new ApiResponse(200, 
                {
                    accessToken,
                },
                "Access token refreshed successfully"
            )
        )
    } 
    catch (error) {
        res.clearCookie("refreshToken");
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body

    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ApiError(400, "All fields are required")
    }
    
    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "New password and confirmation do not match")
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        throw new ApiError(400, "Password must contain at least 8 characters, including uppercase, lowercase, numbers and special characters")
    }

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Current password is incorrect")
    }
    
    if (oldPassword === newPassword) {
        throw new ApiError(400, "New password must be different from current password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    user.refreshToken = undefined;
    await user.save({validateBeforeSave: false});
    
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }

    return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Password changed successfully. Please login again with your new password."))

})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const { fullName, email, phoneNumber, jobRole } = req.body

    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email,
                phoneNumber: phoneNumber,
                jobRole: jobRole
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const getAllUsers = asyncHandler(async(req, res) => {
    
    const users = await User.find({})
        .select("-password -refreshToken")
        .sort({ createdAt: -1 });
    
    return res
        .status(200)
        .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const toggleAdminStatus = asyncHandler(async(req, res) => {
    const { userId } = req.params;
    
    if (!req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }
    
    const targetUser = await User.findById(userId).select("-password -refreshToken");
    
    if (!targetUser) {
        throw new ApiError(404, "User not found");
    }
    
    if (targetUser.isAdmin && req.user._id.toString() !== userId) {
        throw new ApiError(403, "You cannot remove admin privileges from another admin");
    }
    
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        [{ $set: { isAdmin: { $not: "$isAdmin" } } }],
        { new: true, runValidators: false } 
    ).select("-password -refreshToken");
    
    return res
        .status(200)
        .json(new ApiResponse(200, 
            updatedUser, 
            `Admin status ${updatedUser.isAdmin ? 'granted' : 'revoked'} successfully`
        ));
});

const deleteUser = asyncHandler(async(req, res) => {
    const { userId } = req.params;
    if (req.user._id.toString() === userId) {
        throw new ApiError(400, "You cannot delete your own account");
    }
    
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
        throw new ApiError(404, "User not found");
    }
    
    if (userToDelete.isAdmin === true) {
        throw new ApiError(400, "Cannot delete system administrators");
    }
    
    await User.findByIdAndDelete(userId);
    
    return res
        .status(200)
        .json(new ApiResponse(200, 
            { userId, deletedUser: { fullName: userToDelete.fullName, email: userToDelete.email } }, 
            "User deleted successfully"
        ));
});

const getUserCount = asyncHandler(async(req, res) => {
    if (!req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }

    const count = await User.countDocuments({});
    
    return res
        .status(200)
        .json(new ApiResponse(200, { count }, "User count retrieved successfully"));
});

const getAllAdmins = asyncHandler(async (req, res) => {
    try {
        const admins = await User.find({ isAdmin: true })
            .select("_id fullName email isAdmin")
            .sort({ fullName: 1 });
        
        console.log(`Found ${admins.length} system administrators:`, admins.map(a => ({ id: a._id, name: a.fullName, isAdmin: a.isAdmin })));
        
        return res.status(200).json(
            new ApiResponse(200, admins, "System administrators retrieved successfully")
        );
    } 
    catch (error) {
        console.error('Error fetching system administrators:', error);
        throw new ApiError(500, "Failed to fetch system administrators");
    }
});

const testEmailConfig = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new ApiError(400, 'Email address is required');
        }

        console.log('Attempting test email to:', email);
        
        const testResult = await testEmailConfiguration(email);
        
        const message = testResult.success 
            ? 'Test email sent successfully' 
            : `Failed to send test email: ${testResult.error || 'Unknown error'}`;
        
        return res.status(200).json(
            new ApiResponse(
                200, 
                testResult, 
                message
            )
        );
    } 
    catch (error) {
        console.error('Test email error:', error);
        throw new ApiError(500, `Failed to test email: ${error.message}`);
    }
});

const updateUserRole = asyncHandler(async(req, res) => {
    const { userId } = req.params;
    
    if (!req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }
    
    const targetUser = await User.findById(userId).select("-password -refreshToken");
    if (!targetUser) {
        throw new ApiError(404, "User not found");
    }

    await targetUser.save();
    return res
    .status(200)
    .json(new ApiResponse(200, 
        targetUser
    ));
});

const searchUsers = asyncHandler(async (req, res) => {
    const { email, name, limit = 10 } = req.query;
    
    if (!email && !name) {
        throw new ApiError(400, "Please provide email or name to search");
    }
    
    let query = {};
    
    if (email) {
        query.email = { $regex: email, $options: 'i' };
    }
    
    if (name) {
        query.fullName = { $regex: name, $options: 'i' };
    }
    
    const users = await User.find(query)
    .select("_id fullName email")
    .limit(parseInt(limit))
    .sort({ fullName: 1 });
    
    return res
    .status(200)
    .json(new ApiResponse(200, users, `Found ${users.length} user(s)`));
});

const updatePhoneNumber = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    const userId = req.user._id;
    
    if (phoneNumber?.trim()) {
        const phoneRegex = /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;
        if (!phoneRegex.test(phoneNumber.trim())) {
            throw new ApiError(400, "Please enter a valid Australian phone number (e.g. 0412 345 678 or +61412345678)");
        }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { phoneNumber: phoneNumber?.trim() || null },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");
    
    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Phone number updated successfully"));
});

export {
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
    getAllAdmins,
    testEmailConfig,
    updateUserRole,
    searchUsers,
    updatePhoneNumber
}