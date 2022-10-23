const express = require("express");
const expressHandlebars = require("express-handlebars");
const sqlite3 = require("sqlite3");
const expressSession = require("express-session");
const music_TITLE_MAX_LENGTH = 100;
const ADMIN_USERNAME = "Jinming";
const ADMIN_PASSWORD = "123ming";
// const bodyParser = require("body-parser");

const db = new sqlite3.Database("JinmingWang-datebase.db");

db.run(`
	CREATE TABLE IF NOT EXISTS musics (
		id INTEGER PRIMARY KEY,
		title TEXT,
		grade INTEGER
	)
`);

const app = express();

app.engine(
  "hbs",
  expressHandlebars.engine({
    defaultLayout: "main.hbs",
  })
);

app.use(express.static("public"));
app.use(express.static("spectre"));

app.use(
  express.urlencoded({
    extended: false,
  })
);

app.use(
  expressSession({
    saveUninitialized: false,
    resave: false,
    secret: "jifsahgfiahfihjsahfkahgkoahsngklgjn",
  })
);

app.use(function (request, response, next) {
  response.locals.session = request.session;
  next();
});
// ——————————————————————————————————————————————————————————————————————————
app.get("/", function (request, response) {
  response.render("start.hbs");
});

app.get("/musics/create", function (request, response) {
  response.render("create-music.hbs");
});

app.get("/musics/delete", function (request, response) {
  response.render("delete-music.hbs");
});

app.get("/login", function (request, response) {
  response.render("login.hbs");
});

app.get("/musics/update", function (request, response) {
  response.render("update-music.hbs");
});

// ——————————————————————————————————————————————————————————————————————————

app.post("/login", function (request, response) {
  const username = request.body.username;
  const password = request.body.password;

  if (username == ADMIN_USERNAME && password == ADMIN_PASSWORD) {
    request.session.isLoggedIn = true;

    response.redirect("/");
  } else {
    const model = {
      failedToLogin: true,
    };

    response.render("login.hbs", model);
  }
});

// 读取，查read——————————————————————————————————————————————————————————————————————————
app.get("/musics", function (request, response) {
  const query = `SELECT * FROM musics`;
  db.all(query, function (error, musics) {
    const errorMessages = [];
    if (error) {
      errorMessages.push("Internal server error");
    }
    const model = {
      errorMessages,
      musics,
    };

    response.render("musics.hbs", model);
    console.log(musics);
  });
});

// 读取，查——————————————————————————————————————————————————————————————————————————

// 创建，增create——————————————————————————————————————————————————————————————————————————
app.post("/musics/create", function (request, response) {
  const title = request.body.title;
  const grade = parseInt(request.body.grade, 10);
  const errorMessages = [];

  if (title == "") {
    errorMessages.push("Title can't be empty");
  } else if (music_TITLE_MAX_LENGTH < title.length) {
    errorMessages.push(
      "Title may be at most " + music_TITLE_MAX_LENGTH + " characters long"
    );
  }

  if (isNaN(grade)) {
    errorMessages.push("You did not enter a number for the grade");
  } else if (grade < 0) {
    errorMessages.push("Grade may not be negative");
  } else if (10 < grade) {
    errorMessages.push("Grade may at most be 10");
  }

  if (!request.session.isLoggedIn) {
    errorMessages.push("Not logged in");
  }

  if (errorMessages.length == 0) {
    const query = `
			INSERT INTO musics (title, grade) VALUES (?, ?)
		`;
    const values = [title, grade];

    db.run(query, values, function (error) {
      if (error) {
        errorMessages.push("Internal server error");

        const model = {
          errorMessages,
          title,
          grade,
        };

        response.render("create-music.hbs", model);
      } else {
        response.redirect("/musics");
      }
    });
  } else {
    const model = {
      errorMessages,
      title,
      grade,
    };

    response.render("create-music.hbs", model);
  }
});
// 创建，增——————————————————————————————————————————————————————————————————————————

// GET /musics/1
// GET /musics/2
app.get("/musics/:id", function (request, response) {
  const id = request.params.id;

  const query = `SELECT * FROM musics WHERE id = ?`;
  const values = [id];

  db.get(query, values, function (error, music) {
    const model = {
      music,
    };

    response.render("music.hbs", model);
  });
});

app.get("/musics/delete/:id", (req, res) => {
  console.log(req.params);
  console.log(req.params.id);
  let delSql = `DELETE FROM musics where id= ${parseInt(req.params.id)}`;
  console.log(delSql);
  connection.query(delSql, function (error, results) {
    if (error) throw error;
    console.log(results);
    // return results;
    return res.json(results);
  });
});

// 跳转代码——————————————————————————————————————————————————————————————————————————

// 删除，删delete——————————————————————————————————————————————————————————————————————————
app.post("/musics/delete", function (request, response) {
  const title = request.body.title;

  const errorMessages = [];

  if (title == "") {
    errorMessages.push("The title can not be blank");
  }

  if (!request.session.isLoggedIn) {
    errorMessages.push("Not logged in yet");
  }

  if (errorMessages.length == 0) {
    const deleteItem = `
    DELETE FROM musics WHERE title = ?
		`;
    const deleteIndex = [title];

    db.run(deleteItem, deleteIndex, function (error) {
      if (error) {
        errorMessages.push("代码错误");

        const model = {
          errorMessages,
          title,
        };

        response.render("delete-music.hbs", model);
      } else {
        response.redirect("/musics");
      }
    });
  } else {
    const model = {
      errorMessages,
      title,
    };

    response.render("delete-music.hbs", model);
  }
});
// 删除，删——————————————————————————————————————————————————————————————————————————

// 更新，改——————————————————————————————————————————————————————————————————————————

app.post("/musics/update", function (request, response) {
  const title = request.body.title;
  const grade = parseInt(request.body.grade, 10);

  const errorMessages = [];

  if (title == "") {
    errorMessages.push("The title can not be blank");
  }

  if (isNaN(grade)) {
    errorMessages.push("You did not enter a grade number");
  } else if (grade < 0) {
    errorMessages.push("The grade cannot be negative");
  } else if (10 < grade) {
    errorMessages.push("The highest grade of Grade is 10");
  }

  if (!request.session.isLoggedIn) {
    errorMessages.push("Not logged in yet");
  }

  if (errorMessages.length == 0) {
    const upd = `
    UPDATE musics SET grade = ? WHERE title = ?
		`;
    const updval = [grade, title];

    db.run(upd, updval, function (error) {
      if (error) {
        errorMessages.push("Internal server error, check the code!");

        const model = {
          errorMessages,
          title,
          grade,
        };

        response.render("update-music.hbs", model);
      } else {
        response.redirect("/musics");
      }
    });
  } else {
    const model = {
      errorMessages,
      title,
      grade,
    };

    response.render("update-music.hbs", model);
  }
});

// 更新，改——————————————————————————————————————————————————————————————————————————

app.listen(8080);
