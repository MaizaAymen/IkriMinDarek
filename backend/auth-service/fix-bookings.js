const sequelize = require('./config');
const Booking = require('./models/bookingModel');
const Property = require('./models/propertyModel');

async function fixBookings() {
  try {
    console.log('\n=== FIXING BOOKINGS ===\n');
    
    const bookings = await Booking.findAll();
    
    for (const booking of bookings) {
      if (booking.proprietaire_id === null) {
        const property = await Property.findByPk(booking.propriete_id);
        if (property && property.proprietaire_id) {
          await booking.update({ proprietaire_id: property.proprietaire_id });
          console.log(`✅ Fixed booking ${booking.id}: proprietaire_id set to ${property.proprietaire_id}`);
        } else {
          console.log(`❌ Could not fix booking ${booking.id}: property not found or no owner`);
        }
      }
    }
    
    console.log('\n=== VERIFICATION ===\n');
    const fixedBookings = await Booking.findAll({
      include: [
        { model: Property, as: 'propriete', attributes: ['id', 'titre', 'proprietaire_id'] }
      ]
    });
    
    console.log(`Total bookings: ${fixedBookings.length}`);
    console.log(`Bookings with proprietaire_id set: ${fixedBookings.filter(b => b.proprietaire_id !== null).length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixBookings();
