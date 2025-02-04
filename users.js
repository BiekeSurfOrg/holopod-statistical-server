const express = require('express');
const app = express();
const cors = require('cors');
const mysqlx = require('@mysql/xdevapi');
const SCHEMA = 'holopod_statistics';
app.use(cors());
app.get('/test', function (req, res) {
    res.send('Hello World');
});

console.log("app running");

app.listen(process.env.PORT || 8080);

(async () => {
    // Connection to MySQL using MySQL X Protocol
    const session = await mysqlx.getSession({
        host: "nbhkbn.stackhero-network.com",
        port: 36485,
        user: 'root',
        password: "cFa59bggB5XdILEQVYjZMeVP2IahJuON",
    });


    // Create a schema (database) if not exists
    const schemaExists = await session.getSchema('stackherotest').existsInDatabase();
    if (!schemaExists) {
        await session.createSchema('stackherotest');
    }

    // Create table "users" if not exists
    const tableExists = await session
        .getSchema('stackherotest')
        .getTable('users')
        .existsInDatabase();
    if (!tableExists) {
        await session
            .sql('CREATE TABLE `stackherotest`.`users` '
                + '('
                + '`userId` INT UNSIGNED NOT NULL,'
                + '`name` VARCHAR(128) NOT NULL,'
                + '`address` TEXT NOT NULL,'
                + '`email` VARCHAR(265) NOT NULL'
                + ') '
                + 'ENGINE = InnoDB;')
            .execute();
    }


    // Insert a fake user
    await session
        .getSchema('stackherotest') // Database name
        .getTable('users') // Table name
        .insert('userId', 'name', 'address', 'email') // Columns names
        .values(
            Math.round(Math.random() * 100000), // Generate a fake userId
            'User name', // column 'name'
            'User address', // column 'address'
            'user@email.com' // column 'email'
        )
        .execute();


    // Count number of rows in table users
    const usersCount = await session
        .getSchema('stackherotest') // Database name
        .getTable('users')
        .count();

    console.log(`There is now ${usersCount} in table "users"`);

    // Close the connection to MySQL
    await session.close();

})().catch(error => {
    console.error('');
    console.error('🐞 An error occurred!');
    console.error(error);
    process.exit(1);
});