const bcrypt = require("./cript");
const express = require("express");
const app = express();
const cookieSession = require("cookie-session");
const csurf = require("csurf");
var hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
const db = require("./db");
let errorText = {};
let datas = {};
const { getToken, getTweets, filterTweets } = require("./twitter");

app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    next();
});

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(
    require("body-parser").urlencoded({
        extended: false
    })
);

app.use(csurf());

function errorHandle(req, res, next) {
    if (req.body.sign) {
        if (req.body.sign.length <= 490) {
            errorText["sign"] = "This field is required!";
            datas[key] = req.body[key];
        }
    } else {
        for (var key in req.body) {
            if (req.body[key] === "") {
                errorText[key] = "This field is required!";
                datas[key] = req.body[key];
            } else {
                datas[key] = req.body[key];
            }
        }
    }

    next();
}

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.get("/datalink.json", (req, res) => {
    getToken(function(err, token) {
        if (err) {
            console.log("Error in gettoken: ", err);
        }

        getTweets(token, function(err, tweets) {
            if (err) {
                console.log("Error in tweets: ", err);
            }

            var filteredTweets = filterTweets(tweets);
            res.json(filteredTweets);
        });
    });
});

app.get("/", (req, res) => {
    db.getSigners().then(results => {
        var numOfSing = results.rows.length;

        res.render("home", {
            layout: "home",
            numOf: numOfSing,
            title: "Home"
        });
    });
});

app.get("/petition", (req, res) => {
    if (req.session.id) {
        db.chekForName(req.session.id).then(results => {
            if (results.rows[0].signature === null) {
                for (var key in results.rows[0]) {
                    datas[key] = results.rows[0][key];
                }

                res.render("petition", {
                    layout: "main",
                    data: datas,
                    title: "Petition"
                });
            } else {
                res.redirect("/thanks");
            }
        });
    } else {
        res.redirect("/");
    }
});

app.post("/petition", errorHandle, (req, res) => {
    //nevet nem irja ki Bug!!!!
    if (Object.keys(errorText).length != 0) {
        res.render("petition", {
            layout: "main",
            errorText: errorText,
            data: datas,
            title: "Petition"
        });
        errorText = {};
    } else {
        db.createSign(req.body.sign, req.session.id)
            .then(() => {
                res.redirect("/thanks");
            })
            .catch(err => {
                errorText["data"] =
                    "Something wrong with database, please try again";
                res.render("petition", {
                    layout: "main",
                    errorText: errorText
                });
                errorText = {};
                console.log("Error by write the database: ", err);
            });
    }
});

app.get("/registration", (req, res) => {
    res.render("registration", {
        layout: "main",
        title: "Registration"
    });
});

app.post("/registration", errorHandle, (req, res) => {
    if (Object.keys(errorText).length != 0) {
        res.render("registration", {
            layout: "main",
            errorText: errorText,
            data: datas,
            title: "Registration"
        });
        errorText = {};
    } else {
        bcrypt.hash(datas.pass).then(hash => {
            db.createUser(datas.first_name, datas.last_name, datas.email, hash)
                .then(results => {
                    req.session.id = results.rows[0].id;
                    res.redirect("/profil");
                })
                .catch(err => {
                    if (
                        err.detail ==
                        `Key (email)=(${req.body.email}) already exists.`
                    ) {
                        errorText["email"] = "This email is already exists";
                        datas["email"] = "";
                    }
                    res.render("registration", {
                        layout: "main",
                        errorText: errorText,
                        data: datas
                    });
                    errorText = {};
                });
        });
    }
});

app.get("/profil", (req, res) => {
    res.render("profil", {
        layout: "main",
        title: "profil"
    });
});

app.post("/profil", (req, res) => {
    if (req.body.age.length == 0 && req.body.city == 0 && req.body.url == 0) {
        return res.redirect("/petition");
    }
    let urlSplit;
    let urlForWrite;
    if (req.body.url.includes("//")) {
        urlSplit = req.body.url.split("//");
        urlForWrite = urlSplit[1];
    } else {
        urlForWrite = req.body.url;
    }

    db.writeProfil(req.body.age, req.body.city, urlForWrite, req.session.id)
        .then(() => {
            return res.redirect("/petition");
        })
        .catch(err => {
            errorText["data"] =
                "Something wrong with database, please try again";
            res.render("profil", {
                layout: "main",
                errorText: errorText,
                tite: "Profil"
            });
            errorText = {};
            console.log(err);
        });
});

app.get("/login", (req, res) => {
    if (req.session.id) {
        return res.redirect("/petition");
    }
    res.render("login", {
        layout: "main",
        title: "Login"
    });
});

app.post("/login", errorHandle, (req, res) => {
    if (Object.keys(errorText).length != 0) {
        res.render("login", {
            layout: "main",
            errorText: errorText,
            data: datas,
            title: "Login"
        });
        errorText = {};
    } else {
        db.loginUser(req.body.email)
            .then(results => {
                bcrypt
                    .compare(req.body.password, results.rows[0].pass)
                    .then(login => {
                        if (login === true) {
                            req.session.id = results.rows[0].id;
                            res.redirect("/petition");
                        } else {
                            errorText["incorrect"] =
                                "Incorrect email or password, please give once again";
                            res.render("login", {
                                layout: "main",
                                errorText: errorText,
                                title: "Login"
                            });
                            errorText = {};
                        }
                    });
            })
            .catch(err => {
                errorText["incorrect"] =
                    "Incorrect email or password, please give once again";
                console.log(err);
                res.render("login", {
                    layout: "main",
                    errorText: errorText,
                    title: "Login"
                });
                errorText = {};
            });
    }
});

app.get("/thanks", (req, res) => {
    if (req.session.id) {
        db.getSigners().then(resultNumber => {
            db.getSign(req.session.id)
                .then(results => {
                    res.render("thanks", {
                        layout: "main",
                        sign: results.rows[0].sing,
                        number: resultNumber.rows.length,
                        title: "Thank you"
                    });
                })
                .catch(() => {
                    res.render("thanks", {
                        layout: "main",
                        number: resultNumber.rows.length,
                        title: "Thank you"
                    });
                });
        });
    } else {
        res.redirect("/");
    }
});

app.get("/signers", (req, res) => {
    if (req.session.id) {
        db.getSigners().then(results => {
            res.render("signers", {
                layout: "main",
                data: results.rows,
                number: results.rows.length,
                title: "Signers"
            });
        });
    } else {
        res.redirect("/");
    }
});

app.get("/signers/:city", (req, res) => {
    if (req.session.id) {
        db.selectCity(req.params.city).then(results => {
            res.render("city", {
                layout: "main",
                data: results.rows,
                city: req.params.city,
                title: "Signers in " + req.params.city
            });
        });
    }
});

app.get("/profil/edit", (req, res) => {
    if (req.session.id) {
        db.getProfilData(req.session.id)
            .then(results => {
                for (var key in results.rows[0]) {
                    datas[key] = results.rows[0][key];
                }
                res.render("edit", {
                    layout: "profilbg",
                    data: datas,
                    title: "Profil"
                });
                datas = {};
            })
            .catch(err => {
                console.log(err);
                errorText["data"] = "Something wrong, please try again";
                res.render("edit", {
                    layout: "profilbg",
                    data: datas,
                    errorText: errorText,
                    title: "Profil"
                });
                datas = {};
            });
    }
});

app.post("/profil/edit", errorHandle, (req, res) => {
    if (req.body.pass == "") {
        errorText.pass = "";
    }
    if (Object.keys(errorText).length != 0) {
        res.render("edit", {
            layout: "profilbg",
            data: datas,
            errorText: errorText,
            title: "Profil"
        });
        errorText = {};
    } else {
        if (req.body.pass == "") {
            db.updateProfilData(
                req.session.id,
                req.body.first_name,
                req.body.last_name,
                req.body.email
            )
                .then(() => {
                    db.updateUsersProfil(
                        req.session.id,
                        req.body.age,
                        req.body.city,
                        req.body.url
                    )
                        .then(() => {
                            res.redirect("/profil/edit");
                        })
                        .catch(err => {
                            console.log(err);
                            errorText["data"] =
                                "Something wrong, please try again";
                            res.render("edit", {
                                layout: "profilbg",
                                data: datas,
                                errorText: errorText,
                                title: "Profil"
                            });
                            errorText = {};
                        });
                })
                .catch(err => {
                    console.log(err);
                    errorText["data"] = "Something wrong, please try again";
                    res.render("edit", {
                        layout: "profilbg",
                        data: datas,
                        errorText: errorText,
                        title: "Profil"
                    });
                    errorText = {};
                });
        } else {
            db.updateProfilData(
                req.session.id,
                req.body.first_name,
                req.body.last_name,
                req.body.email
            )
                .then(() => {
                    db.updateUsersProfil(
                        req.session.id,
                        req.body.age,
                        req.body.city,
                        req.body.url
                    )
                        .then(() => {
                            bcrypt.hash(req.body.pass).then(hash => {
                                db.updatePass(req.session.id, hash).then(() => {
                                    res.redirect("/profil/edit");
                                });
                            });
                        })
                        .catch(err => {
                            console.log(err);
                            errorText["data"] =
                                "Something wrong, please try again";
                            res.render("edit", {
                                layout: "profilbg",
                                data: datas,
                                errorText: errorText,
                                title: "Profil"
                            });
                            errorText = {};
                        });
                })
                .catch(err => {
                    console.log(err);
                    errorText["data"] = "Something wrong, please try again";
                    res.render("edit", {
                        layout: "profilbg",
                        data: datas,
                        errorText: errorText,
                        title: "Profil"
                    });
                    errorText = {};
                });
        }
    }
});

app.post("/delsig", (req, res) => {
    if (req.session.id) {
        db.delSignatures(req.session.id)
            .then(() => {
                res.redirect("/petition");
            })
            .catch(err => {
                console.log(err);
                errorText["data"] =
                    "Something wrong by deleting your signature, please try again";
                res.render("edit", {
                    layout: "main",
                    data: datas,
                    errorText: errorText,
                    title: "Profil"
                });
                errorText = {};
            });
    } else {
        res.redirect("/");
    }
});

app.post("/delprofil", (req, res) => {
    if (req.session.id) {
        db.delSignatures(req.session.id)
            .then(() => {
                db.delUserProfils(req.session.id)
                    .then(() => {
                        db.delProfil(req.session.id)
                            .then(() => {
                                res.redirect("/logout");
                            })
                            .catch(err => {
                                errorText["data"] =
                                    "Something wrong by deleting your profil, pleas try again";
                                res.render("edit", {
                                    layout: "main",
                                    errorText: errorText,
                                    title: "Profil"
                                });
                                console.log("Error by delete profil", err);
                            });
                    })
                    .catch(err => {
                        errorText["data"] =
                            "Something wrong by deleting your profil, pleas try again";
                        res.render("edit", {
                            layout: "main",
                            errorText: errorText,
                            title: "Profil"
                        });
                        console.log("Error by delete users profil ", err);
                    });
            })
            .catch(err => {
                errorText["data"] =
                    "Something wrong by deleting your signature, pleas try again";
                res.render("edit", {
                    layout: "main",
                    errorText: errorText,
                    title: "Profil"
                });
                console.log("Error by delet signature ", err);
            });
    } else {
        res.redirect("/");
    }
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
});
app.use(express.static("./public"));

app.listen(process.env.PORT || 8080, () => console.log("Its run"));
