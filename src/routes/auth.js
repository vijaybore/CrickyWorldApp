// routes/auth.js — CrickyWorld backend
const express    = require('express')
const router     = express.Router()
const jwt        = require('jsonwebtoken')
const User       = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET || 'crickyworld_secret_key_2024'

// In-memory OTP store (fine for free tier — resets on restart)
const otpStore = new Map() // mobile → { otp, expires }

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { mobile } = req.body
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: 'Valid 10-digit mobile number required' })
    }

    const otp     = generateOTP()
    const expires = Date.now() + 5 * 60 * 1000 // 5 minutes
    otpStore.set(mobile, { otp, expires })

    // OTP printed in Render logs — check dashboard
    console.log(`\n🔐 OTP for ${mobile}: ${otp}  (valid 5 min)\n`)

    const user = await User.findOne({ mobile })
    res.json({
      success: true,
      exists:  !!user,
      name:    user?.name ?? null,
      message: 'OTP sent'
    })
  } catch (err) {
    console.error('send-otp error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, otp, name, deviceId } = req.body

    if (!mobile || !otp) {
      return res.status(400).json({ message: 'Mobile and OTP required' })
    }

    const stored = otpStore.get(mobile)
    if (!stored) {
      return res.status(400).json({ message: 'OTP not found. Please request a new one.' })
    }
    if (Date.now() > stored.expires) {
      otpStore.delete(mobile)
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' })
    }
    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' })
    }

    otpStore.delete(mobile)

    let user = await User.findOne({ mobile })
    if (!user) {
      const username = name?.trim() || `User${mobile.slice(-4)}`
      user = await User.create({ mobile, name: username, deviceId: deviceId || '' })
    } else if (deviceId) {
      user.deviceId = deviceId
      await user.save()
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '90d' })
    res.json({
      success:  true,
      token,
      username: user.name,
      user:     { id: user._id, name: user.name, mobile: user.mobile }
    })
  } catch (err) {
    console.error('verify-otp error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ── POST /api/auth/verify-firebase ───────────────────────────────────────────
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

// ── POST /api/auth/device-login ───────────────────────────────────────────────
router.post('/device-login', async (req, res) => {
  try {
    const { deviceId } = req.body
    if (!deviceId) return res.status(400).json({ message: 'deviceId required' })
    const user = await User.findOne({ deviceId })
    if (!user) return res.status(404).json({ message: 'No account for this device' })
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '90d' })
    res.json({ success: true, token, username: user.name,
      user: { id: user._id, name: user.name, mobile: user.mobile } })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'No token' })
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password -__v')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' })
  }
})

// Keep old register/login for backward compat
router.post('/register', async (req, res) => res.status(410).json({ message: 'Use OTP login' }))
router.post('/login',    async (req, res) => res.status(410).json({ message: 'Use OTP login' }))

module.exports = router