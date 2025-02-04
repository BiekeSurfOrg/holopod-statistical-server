const express = require('express');
const app = express();
const cors = require('cors')
const mysqlx = require('@mysql/xdevapi');
const SCHEMA = 'holopod_statistics';
app.use(cors())
app.get('/test', function (req, res) {
  res.send('Hello World');
});

console.log("app running");

(async () => {
  // Connection to MySQL using MySQL X Protocol
  const session = await mysqlx.getSession({
    host: "nbhkbn.stackhero-network.com",
    port: 36485,
    user: 'root',
    password: "cFa59bggB5XdILEQVYjZMeVP2IahJuON",
  });

  // Create a schema (database) if not exists
  const schemaExists = await session.getSchema(SCHEMA).existsInDatabase();

  if (!schemaExists) {
    await session.createSchema(SCHEMA);
  }

  // Create table "projects" if not exists
  const tableExists = await session
    .getSchema(SCHEMA)
    .getTable('projects')
    .existsInDatabase();
  if (!tableExists) {
    await session
      .sql(`CREATE TABLE ${SCHEMA}.projects `
        + '('
        + '`projectId` INT UNSIGNED NOT NULL AUTO_INCREMENT,'
        + '`name` VARCHAR(128) NOT NULL,'
        + 'PRIMARY KEY (projectId)'
        + ') '
        + 'ENGINE = InnoDB;')
      .execute();
  }

  // Create table "pages" if not exists
  const pagesTableExists = await session
    .getSchema(SCHEMA)
    .getTable('pages')
    .existsInDatabase();
  if (!pagesTableExists) {
    await session
      .sql(`CREATE TABLE ${SCHEMA}.pages `
        + '('
        + '`pageId` INT UNSIGNED NOT NULL AUTO_INCREMENT,'
        + '`projectId` INT UNSIGNED NOT NULL,'
        + '`content` TEXT NOT NULL,'
        + 'PRIMARY KEY (pageId),'
        + 'FOREIGN KEY (projectId) REFERENCES projects(projectId)'
        + ') '
        + 'ENGINE = InnoDB;')
      .execute();
  }

  // Create table "results" if not exists
  const resultsTableExists = await session
    .getSchema(SCHEMA)
    .getTable('results')
    .existsInDatabase();
  if (!resultsTableExists) {
    await session
      .sql(`CREATE TABLE ${SCHEMA}.results `
        + '('
        + '`resultId` INT UNSIGNED NOT NULL AUTO_INCREMENT,'
        + '`pageId` INT UNSIGNED NOT NULL,'
        + '`data` TEXT NOT NULL,'
        + 'PRIMARY KEY (resultId),'
        + 'FOREIGN KEY (pageId) REFERENCES pages(pageId)'
        + ') '
        + 'ENGINE = InnoDB;')
      .execute();
  }
})().catch(error => {
  console.error('');
  console.error('🐞 An error occurred!');
  console.error(error);
  process.exit(1);
});

app.listen(process.env.PORT || 8080);