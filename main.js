var http = require('http');
var url = require('url');
var mysql = require('mysql');
var qs = require('querystring');

var con = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Dodo9852@@!',
  database : 'russian'
});

// var con = mysql.createConnection({
//   host     : 'localhost',
//   user     : 'root',
//   password : 'Dodo9852@@!',
//   database : 'primiery_test_1'
// });

var selected_s = {
  /*'getObj': function(s_id) {
    var my_promise = new Promise (function(resolve, reject) {
      var sql = `SELECT sentence.id, sentence.content AS sentence, phrase.content AS phrase FROM sentence LEFT JOIN includes ON sentence.id=includes.s_id LEFT JOIN phrase ON includes.p_id=phrase.id WHERE sentence.id=${s_id};`;

      con.query(sql, function(err, selected_s_obj) {
        resolve(selected_s_obj);
      });
    });

    my_promise.then(function(selected_s_obj) {
      return selected_s_obj;
    });
  },*/
  'getSentence': function(selected_s_obj) {
    return selected_s_obj[0].sentence;
  },
  'getPhrasesLi': function(selected_s_obj) {
    var phrases_list = '';
    for (let i = 0; i < selected_s_obj.length; i++) {
      phrases_list += `<li>${selected_s_obj[i].phrase}</li>`;
    }

    return phrases_list;
  }
};

var selected_p = {
  'getPhrase': function(selected_p_obj) {
    return selected_p_obj[0].phrase;
  },
  'getSentencesLi': function(selected_p_obj) {
    var sentences_list = '';
    for (let i = 0; i < selected_p_obj.length; i++) {
      sentences_list += `<li>${selected_p_obj[i].sentence}</li>`;
    }

    return sentences_list;
  }
};

function addEscapeSeq(str) {
  if(str.includes(`"`)) {
    str = str.replaceAll(`"`, `\"`);
  }
  if(str.includes(`'`)) {
    str = str.replaceAll(`'`, `\'`);
  }

  return str;
}

function createContent(title, prev_page_href, prev_page, page_desc, body) {
  var template = `
  <!DOCTYPE html>
  <html lang="en" dir="ltr">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        nav {
          background-color: beige;
        }
        h1 {
          text-align: center;
        }
        #page-desc {
          text-align: center;
        }
      </style>
    </head>
    <body>
      <nav>
        <h1><a href="/main">Primiery</a><br></h1>
        <a href="${prev_page_href}" class="nav-menu">${prev_page}</a>
        <a href="#" class="nav-menu">Log out</a>
      </nav>

      <h3 id="page-desc">${page_desc}</h3>

      ${body}
    </body>
  </html>
  `;

  return template;
}

function createDBList(root_href, array) { // Returns <ul> list for sentences/phrases list page
  var list = '<ul>';

  for (let i = 0; i < array.length; i++) {
    list += `<li><a href="${root_href}/?id=${array[i].id}">${array[i].content}</a></li>`;
  }
  list += '</ul>';

  return list;
}

http.createServer(function(req, res) {
  var url_obj = url.parse(req.url, true);
  if(url_obj.pathname === '/main') {
    res.writeHead(200, {'Content-Type': 'text/html'});

    var body = `
    <a href="/my-sentences">Manage sentences</a><br>
    <a href="/my-phrases">Manage phrases</a>
    `;
    var content = createContent('Main', '#', '', "Welcome to 'Primiery', a sentence flashcard application.", body);

    res.write(content);
    res.end();
  }
  else if(url_obj.pathname.startsWith('/my-sentences')) {
    if(url_obj.pathname === '/my-sentences') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      var sql = 'SELECT * FROM sentence ORDER BY id DESC;';

      con.query(sql, function(err, result) {
        var body = `<a href="/my-sentences/add">Add new sentence</a><br>
        ${createDBList(url_obj.pathname, result)}`;

        var content = createContent('My Sentences', '/main', '< Home', 'Manage my sentences', body);
        res.write(content);
        res.end();
      });
    }
    else if(url_obj.pathname === '/my-sentences/add') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      var body = `
      <form action="http://localhost:2223/my-sentences/add/send-form" method="post">
        <div>
          <textarea name="sentence" placeholder="Enter sentence."></textarea>
        </div>
        <div>
          <input type="submit">
        </div>
      </form>
      `;

      var content = createContent('My Sentences - Add', '/my-sentences', '< Manage my sentences', 'Add new sentence', body);
      res.write(content);
      res.end();
    }
    else if(url_obj.pathname === '/my-sentences/add/send-form') {
      var full_data = '';
      req.on('data', function(data) {
        full_data += data;
      });
      req.on('end', function(end) {
        var added_sentence = qs.parse(full_data).sentence;
        var sql = `INSERT IGNORE INTO sentence (content) VALUES ("${addEscapeSeq(added_sentence)}")`;

        con.query(sql, function(err, result) {
          res.writeHead(302, {Location: '/my-sentences'});
          res.end();
        })
      });
    }
    else if(url_obj.query.id != undefined) {
      var s_id = url_obj.query.id;
      res.writeHead(200, {'Content-Type': 'text/html'});
      var sql = `SELECT sentence.id, sentence.content AS sentence, phrase.content AS phrase FROM sentence LEFT JOIN includes ON sentence.id=includes.s_id LEFT JOIN phrase ON includes.p_id=phrase.id WHERE sentence.id=${s_id};`;

      con.query(sql, function(err, selected_s_obj) {
        var body = `
        <h4>${selected_s.getSentence(selected_s_obj)}</h4>

        <ul>
          ${selected_s.getPhrasesLi(selected_s_obj)}
        </ul>

        <form action="http://localhost:2223/my-phrases/add/send-form/?id=${s_id}" method="post">
          <div>
            <textarea name="phrase" placeholder="Enter phrase."></textarea>
          </div>
          <div>
            <input type="submit">
          </div>
        </form>

        <a href="/my-sentences/edit/?id=${s_id}">Edit sentence</a>
        <a href="#">Delete sentence</a>
        `;

        var content = createContent('My Sentences - View', '/my-sentences', '< Manage my sentences', 'Manage selected sentence', body);
        res.write(content);
        res.end();
      });
    }
  }
  else if(url_obj.href.toLowerCase().startsWith('/my-phrases')) {
    if(url_obj.pathname === '/my-phrases') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      var sql = 'SELECT * FROM phrase ORDER BY id DESC;';

      con.query(sql, function(err, result) {
        var body = `${createDBList(url_obj.pathname, result)}`;

        var content = createContent('My Phrases', '/main', '< Home', 'Manage my phrases', body);
        res.write(content);
        res.end();
      });
    }
    else if(url_obj.pathname.startsWith('/my-phrases/add/send-form')) {
      var full_data = '';
      var s_id = url_obj.query.id;

      req.on('data', function(data) {
        full_data += data;
      });
      req.on('end', function(end) {
        var sql_promise = new Promise(function(resolve, reject) {
          var added_phrase = qs.parse(full_data).phrase;
          var sql = `INSERT INTO phrase (content)
          VALUES ("${addEscapeSeq(added_phrase)}")
          ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);`;

          con.query(sql, function(err, result) {
            resolve(result.insertId);
          });
        });

        sql_promise.then(function(p_id) {
          var sql = `INSERT INTO includes (s_id, p_id) VALUES (${s_id}, ${p_id})`;
          con.query(sql, function(err, result) {
            res.writeHead(302, {Location: `/my-sentences/?id=${s_id}`});
            res.end();
          });
        });
      });
    }
    else if(url_obj.query.id != undefined) {
      var p_id = url_obj.query.id;
      res.writeHead(200, {'Content-Type': 'text/html'});
      var sql = `SELECT phrase.id, phrase.content AS phrase, sentence.content AS sentence FROM phrase LEFT JOIN includes ON phrase.id=includes.p_id LEFT JOIN sentence ON includes.s_id=sentence.id WHERE phrase.id=${p_id};`;

      con.query(sql, function(err, selected_p_obj) {
        var body = `
        <h4>${selected_p.getPhrase(selected_p_obj)}</h4>

        <ul>
          ${selected_p.getSentencesLi(selected_p_obj)}
        </ul>

        <a href="/my-phrases/edit/?id=${p_id}">Edit phrase</a>
        <a href="#">Delete phrase</a>
        `;

        var content = createContent('My Phrases - View', '/my-phrases', '< Manage my phrases', 'Manage selected phrase', body);
        res.write(content);
        res.end();
      });
    }
    else {
      res.writeHead(200);
      res.end('phra');
    }
  }
  else {
    res.writeHead(404);
    res.end('404 Error: Not found.');
  }

}).listen(2223); // if you're planning to change the host, make sure to make extra moderations within the code above.
