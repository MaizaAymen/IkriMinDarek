const sequelize = require('./config');
const Booking = require('./models/bookingModel');
const User = require('./models/userModel');

async function checkBookings() {
  try {
    console.log('\n=== CHECKING BOOKINGS IN DATABASE ===\n');
    
    const allBookings = await Booking.findAll({
      include: [
        { model: User, as: 'locataire', attributes: ['id', 'nom', 'prenom'] },
        { model: User, as: 'proprietaire', attributes: ['id', 'nom', 'prenom'] }
      ]
    });

    console.log(`Total bookings: ${allBookings.length}\n`);
    
    allBookings.forEach((b, idx) => {
      console.log(`Booking ${idx + 1}:`);
      console.log(`  ID: ${b.id}`);
      console.log(`  Status: ${b.statut}`);
      console.log(`  Tenant: ${b.locataire?.id} (${b.locataire?.prenom} ${b.locataire?.nom})`);
      console.log(`  Owner: ${b.proprietaire?.id} (${b.proprietaire?.prenom} ${b.proprietaire?.nom})`);
      console.log(`  locataire_id: ${b.locataire_id}, proprietaire_id: ${b.proprietaire_id}`);
      console.log();
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBookings();
