const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("./models/User");

router.post("/login-email", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email)
            return res.status(400).json({ error: "Email is required" });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(404).json({ error: "User not found" });

        // update last verification/login time
        user.time_of_ver = new Date();
        await user.save();

        // create JWT with expiration
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // send secure cookie
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax",
            maxAge: 3600000, // 1 hour
        });

        return res.status(200).json({
            message: "Logged in successfully",
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ error: "Server error during login" });
    }
});

module.exports = router;