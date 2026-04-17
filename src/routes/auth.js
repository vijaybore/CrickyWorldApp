const express = require('express')
const router  = express.Router()

router.post('/send-otp',     /* your existing handler */)
router.post('/verify-otp',   /* updated handler from Step 2.2 */)
router.post('/device-login', /* new handler from Step 2.3 */)
router.get('/me',            auth, /* your existing handler */)

module.exports = router
if (req.body.deviceId) {
  user.deviceId = req.body.deviceId
  await user.save()
}

const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '90d' })
res.json({
  token,
  user: { id: user._id, name: user.name, mobile: user.mobile }
})
router.post('/device-login', async (req, res) => {
  try {
    const { deviceId } = req.body
    if (!deviceId) {
      return res.status(400).json({ message: 'deviceId is required' })
    }

    const user = await User.findOne({ deviceId })
    if (!user) {
      return res.status(404).json({ message: 'No account found for this device' })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '90d' })
    res.json({
      token,
      user: { id: user._id, name: user.name, mobile: user.mobile }
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})