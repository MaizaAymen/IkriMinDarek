// Quick check to see what's in the database for properties
const sequelize = require('./config');
const Property = require('./models/propertyModel');

async function checkDatabase() {
    try {
        const properties = await Property.findAll({
            limit: 5,
            raw: true,
            attributes: ['id', 'titre', 'images', 'image_principale', 'statut_approbation']
        });

        console.log('\n📊 Properties in Database:');
        properties.forEach(p => {
            console.log(`\nProperty ${p.id}:`, {
                titre: p.titre,
                status: p.statut_approbation,
                imagesCount: p.images ? p.images.length : 0,
                images: p.images,
                imagePrincipale: p.image_principale
            });
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDatabase();
