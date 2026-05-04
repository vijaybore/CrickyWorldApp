// ── POST /api/auth/Verifyfirebaseroute.js ───────────────────────────────────────────
// Called AFTER Firebase has already verified the OTP on the device.
// Firebase handled the SMS + OTP check — we just create/fetch the user and return JWT.
router.post('/verify-firebase', async (req, res) => {
  try {
    const { mobile, name } = req.body

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: 'Valid mobile number required' })
    }

    let user = await User.findOne({ mobile })

    if (!user) {
      // New user — create account
      const username = name?.trim() || `User${mobile.slice(-4)}`
      user = await User.create({ mobile, name: username, deviceId: '' })
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '90d' })

    res.json({
      success:  true,
      token,
      username: user.name,
      user:     { id: user._id, name: user.name, mobile: user.mobile },
    })
  } catch (err) {
    console.error('verify-firebase error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})