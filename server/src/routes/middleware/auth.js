const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const AuthJwt = require("./AuthJWT");

router.post("/login-email", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // update login time
        user.time_of_ver = new Date();
        await user.save();

        // create token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        const isProd = process.env.NODE_ENV === "production";

        // send cookie
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "None" : "Lax",
            maxAge: 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Logged in successfully",
            token,                 // ✅ optional but useful for frontend
            userId: user._id,
            email: user.email,
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ error: "Server error during login" });
    }
});


// sign-up route
router.post("/signup-email", async (req, res) => {
    console.log("Signup request received with body:", req.body);

    try {
        const { email, password, name } = req.body;

        // 1. Basic validation
        if (!email || !password || !name) {
            return res.status(400).json({ error: "Name, email, and password are required" });
        }

        // 2. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }

        // 3. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            time_of_ver: new Date(),
        });

        await user.save();

        // 5. Create JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        const isProd = process.env.NODE_ENV === "production";

        // 6. Send secure cookie
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "None" : "Lax",
            maxAge: 3600000, // 1 hour
        });

        return res.status(201).json({
            message: "User created and logged in successfully",
        });

    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        return res.status(500).json({ error: "Server error during signup" });
    }
});

// verification endpoint – ensures token valid and returns decoded user
router.get("/verify", AuthJwt, (req, res) => {
    return res.status(200).json({ user: req.user });
});

// logout route clears cookie
router.post("/logout", (req, res) => {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("jwt", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
    });
    return res.json({ message: "Logged out" });
});

module.exports = router;
