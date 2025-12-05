const sequelize = require('./config');

(async () => {
  try {
    const result = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_schema = 'ikri' AND table_name = 'bookings'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Bookings table columns:');
    result[0].forEach(col => console.log('  -', col.column_name, ':', col.data_type));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
})();
