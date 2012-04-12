var program = require('commander');
var _ = require('underscore');
var results = {};
var queries;

program
    .version('0.0.1')
    .option('-q, --query [query]', 'Run a JSON query block')
    .option('-d, --database [database]', 'Database to query', 'test')
    .option('-u, --user [user]', 'User name', 'root')
    .option('-p, --pass [pass]', 'Password', '')
    .option('-h, --host [host]', 'Host', '127.0.0.1')
    .option('-P, --port [port]', 'Port', '3306')
    .option('-d, --demo', 'Run a demo query')
    .parse(process.argv);

 if (program.query) {
  queries = JSON.parse(program.query);
} else if (program.demo) {
  queries = {0: {query: "select * from no_sql"}, 1: {query: "select * from no_sql where type = ?", params: ["test"]}};
}

if (!queries) {
  console.error("No query set");
  process.exit(1);
} else {
  var db = require("mysql-native").createTCPClient(program.host, program.port);
  db.auto_prepare = true;
  db.auth(program.database, program.user, program.pass);

  var completedQueries = 0;
  _.each(queries, function (query) {
    parseResults(db.execute(query.query, query.params || []), completedQueries);
    completedQueries++;
  });

  var returnResultSet = _.after(completedQueries, function () {
    console.log(results);
  });

  db.close();
}

function parseResults(cmd, count) {
  cmd.addListener('end', function () {
    returnResultSet();
  });
  cmd.addListener('row', function (r) {
    if (_.isUndefined(results[count])) {
      results[count] = [];
    }
    results[count].push(r);
  });
}
