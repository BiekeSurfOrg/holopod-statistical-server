const express = require('express');
const app = express();
const cors = require('cors');
const mysqlx = require('@mysql/xdevapi');
const SCHEMA = 'holopod-statistics';
app.use(cors());
app.use(express.json());
app.get('/test', function (req, res) {
  res.send('Hello World');
});

console.log("app running");

app.listen(process.env.PORT || 8080);

const initSesion = async () => {
  return await mysqlx.getSession({
    host: "nbhkbn.stackhero-network.com",
    port: 36485,
    user: 'root',
    password: "cFa59bggB5XdILEQVYjZMeVP2IahJuON",
  });
}

(async () => {
  // Connection to MySQL using MySQL X Protocol
  const session = await initSesion();


  // Create a schema (database) if not exists
  const schemaExists = await session.getSchema(SCHEMA).existsInDatabase();

  if (!schemaExists) {
    await session.createSchema(SCHEMA);
  }

  // Create table "users" if not exists
  const tableExists = await session
    .getSchema(SCHEMA)
    .getTable('projects')
    .existsInDatabase();
  if (!tableExists) {
    await session
      .sql('CREATE TABLE `holopod-statistics`.`projects` '
        + '('
        + '`projectId` INT UNSIGNED NOT NULL AUTO_INCREMENT,'
        + '`projectName` VARCHAR(128) NOT NULL,'
        + 'PRIMARY KEY (projectId)'
        + ') '
        + 'ENGINE = InnoDB;')
      .execute();
  }
  const pagesTableExists = await session
    .getSchema(SCHEMA)
    .getTable('pages')
    .existsInDatabase();
  if (!pagesTableExists) {
    await session
      .sql('CREATE TABLE `holopod-statistics`.`pages` '
        + '('
        + '`pageId` INT UNSIGNED NOT NULL AUTO_INCREMENT,'
        + '`projectId` INT UNSIGNED NOT NULL,'
        + '`pageName` TEXT NOT NULL,'
        + 'PRIMARY KEY (pageId),'
        + 'FOREIGN KEY (projectId) REFERENCES projects(projectId)'
        + ') '
        + 'ENGINE = InnoDB;')
      .execute();
  }

  const daysTableExists = await session
  .getSchema(SCHEMA)
  .getTable('days')
  .existsInDatabase();
if (!pagesTableExists) {
  await session
    .sql('CREATE TABLE `holopod-statistics`.`days` '
      + '('
      + '`dayId` INT UNSIGNED NOT NULL AUTO_INCREMENT,'
      + '`pageId` INT UNSIGNED NOT NULL,'
      + '`day` TEXT NOT NULL,'
      + 'PRIMARY KEY (dayId),'
      + 'FOREIGN KEY (pageId) REFERENCES projects(pageId)'
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
      .sql('CREATE TABLE `holopod-statistics`.`results` '
        + '('
        + '`resultId` INT UNSIGNED NOT NULL AUTO_INCREMENT,'
        + '`pageId` INT UNSIGNED NOT NULL,'
        + '`pageVisits` INT NOT NULL,'
        + 'PRIMARY KEY (resultId),'
        + 'FOREIGN KEY (pageId) REFERENCES pages(pageId)'
        + ') '
        + 'ENGINE = InnoDB;')
      .execute();
  }


  // Count number of rows in table users
  const projectsCount = await session
    .getSchema(SCHEMA) // Database name
    .getTable('projects')
    .count();

  console.log(`There is now ${projectsCount} in table "projects"`);

  // Close the connection to MySQL
  await session.close();

})().catch(error => {
  console.error('');
  console.error('🐞 An error occurred!');
  console.error(error);
  process.exit(1);
});

app.post('/projects/:project', async function (req, res) {
  const pages = JSON.parse(req.body.pages.replace(/'/g, '"'));
  const session = await initSesion();
  const schema = session.getSchema(SCHEMA);
  const table = schema.getTable('projects');
  let projectId;

  // Check if the project already exists
  const result = await table.select('projectId')
    .where('projectName = :projectName')
    .bind('projectName', req.params.project)
    .execute();

  if (result.fetchOne()) {

    res.send('Project already exists');
  } else {
    await table.insert('projectName').values(req.params.project).execute().then(result => {
      projectId = result.getAutoIncrementValue();
    });
    for (let index = 0; index < pages.length; index++) {
      const element = pages[index];
      let pageId
      await schema.getTable('pages').insert('projectId', 'pageName').values(projectId, element).execute().then(result => {
        pageId = result.getAutoIncrementValue();
      });
      await schema.getTable('results').insert('pageId', 'pageVisits').values(pageId, 0).execute();
    }

    res.send('Project added');
  }

  await session.close();
});

app.post('/results/:page', async function (req, res) {
  const session = await initSesion();
  const schema = session.getSchema(SCHEMA);
  const table = schema.getTable('results');

  const pageid = await schema.getTable('pages').select('pageId')
    .where('pageName = :pageName')
    .bind('pageName', req.params.page)
    .execute();

  // Query the result based on the pageId
  const result = await table.select('resultId', 'pageVisits')
    .where('pageId = :pageId')
    .bind('pageId', pageid.fetchOne()[0])
    .execute();

  const resultData = result.fetchOne();
  if (resultData) {
    res.json({ resultId: resultData[0], pageVisits: resultData[1] });
  } else {
    res.status(404).send('Result not found');
  }

  await session.close();

});
