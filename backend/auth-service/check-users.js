const sequelize = require("./config");
const User = require("./models/userModel");

async function checkUsers() {
  try {
    console.log('📊 Checking users in database...\n');
    
    // Create schema if it doesn't exist
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS ikri;');
    
    // Sync models
    await sequelize.sync({ alter: true });
    
    // Get all users
    const users = await User.findAll();
    
    console.log(`\n✅ Total users in database: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('📋 User list:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.nom} ${user.prenom}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${user.createdAt}`);
      });
    } else {
      console.log('⚠️  No users found in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();
