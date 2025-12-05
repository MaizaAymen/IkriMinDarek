const sequelize = require('./config');
const Property = require('./models/propertyModel');
const User = require('./models/userModel');

async function checkProperties() {
  try {
    console.log('\n=== CHECKING PROPERTIES IN DATABASE ===\n');
    
    const properties = await Property.findAll({
      include: { model: User, as: 'proprietaire', attributes: ['id', 'nom', 'prenom'] },
      limit: 5
    });

    console.log(`Total properties (showing first 5): ${properties.length}\n`);
    
    properties.forEach((p, idx) => {
      console.log(`Property ${idx + 1}:`);
      console.log(`  ID: ${p.id}`);
      console.log(`  Title: ${p.titre}`);
      console.log(`  Owner ID: ${p.proprietaire_id}`);
      console.log(`  Owner: ${p.proprietaire?.nom || 'UNDEFINED'}`);
      console.log();
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProperties();
