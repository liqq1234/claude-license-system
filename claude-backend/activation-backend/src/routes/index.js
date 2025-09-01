router.post('/activate', extendedHandler.activateDevice.bind(extendedHandler))
router.post('/validate', extendedHandler.validateLicense.bind(extendedHandler))