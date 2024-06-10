// controllers/paymentController.js
const processPayment = (req, res) => {
    const { contact, delivery, payment } = req.body;
    
    // Aquí puedes implementar la lógica para procesar el pago
    // Integración con PayPal, procesamiento de tarjetas, etc.
  
    res.status(200).json({ message: 'Payment processed successfully' });
  };
  
  module.exports = {
    processPayment
  };
  