import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Full Name is required'],
            maxLength: [100, 'Name cannot exceed 100 characters'],
            match: [/^[a-zA-Z\s'-]+$/, 'Please enter a valid name']
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: (v) => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(v),
                message: "Invalid email format"
            }
        },
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 24,
            validate: {
                validator: (v) => /^[a-zA-Z0-9._-]+$/.test(v) && !/\.\.|--|__|\.-|-_|\._|_\./.test(v),
                message: 'Username can only contain letters, numbers, ., -, _ and no consecutive special characters'
            }
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 6 characters'],
            validate: {
                validator: (v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+={}\[\]|\\:;"'<>,.~`-])[A-Za-z\d@$!%*?&#^()_+={}\[\]|\\:;"'<>,.~`-]{8,}$/.test(v),
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            }
        },
        phoneNumber: {
            type: String,
            trim: true,
            validate: {
                validator: (v) => {
                    if (!v) return true;
                    return /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/.test(v);
                },
                message: 'Please enter a valid Australian phone number'
            }
        },
        jobRole: {
            type: String,
            required: [true, 'Job Role is required']
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
            select: false,
        },
        resetPasswordToken: {
            type: String,
            select: false,
        },
        resetPasswordExpires: {
            type: Date,
            select: false,
        },
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
            phoneNumber: this.phoneNumber,
            isAdmin: this.isAdmin
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);