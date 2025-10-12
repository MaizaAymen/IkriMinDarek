const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'IKRIMINDAREK', // la base
  'postgres',     // user
  'aymen',        // password
  {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432,
    define: {
      schema: 'ikri'   //  toutes les tables iront dans ikri
    }
  }
);

sequelize.authenticate().then(()=>{
    console.log('Connected to IKRIMINDAREK database');
}).catch((err)=>{
    console.log('Error: '+ err);
})
module.exports = sequelize;