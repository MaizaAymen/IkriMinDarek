const sequelize = require('./config');
const User = require('./models/userModel');

async function checkUsers() {
    try {
        const users = await User.findAll({
            limit: 10,
            raw: true,
            attributes: ['id', 'email', 'role', 'nom', 'prenom']
        });

        console.log('\n👥 Users in Database:');
        if (users.length === 0) {
            console.log('No users found!');
        } else {
            users.forEach(u => {
                console.log(`User ${u.id}: ${u.nom} ${u.prenom} (${u.email}) - Role: ${u.role}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();
