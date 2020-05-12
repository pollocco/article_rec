var express = require('express');
var session = require('express-session');
var mysql = require('./dbcon.js');  // this is my database config.
var bcrypt = require('bcrypt');
var path = require('path');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
var bodyParser = require('body-parser');

var handlebars = require('express-handlebars').create({defaultLayout:'main'});

var app = express();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(express.static('public'));

app.set('port', process.argv[2])

app.use(function(req, res, next){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var router = express.Router();

app.get('/index', function(req, res){
    var context = {}
    res.render('index', context)
});

app.get('/form', function(req,res){
    var context = {}
    if(req.session.loggedin){
        context.message = "Hey there " + req.session.username;
        context.user = req.session.username;
        context.isLoggedOut = false;
        context.isLoggedIn = true;
    }
    else if(req.session.isRegistered){
        context.message = "You're all signed up " + req.session.regEmail + ". Be even cooler if you signed in.";
        context.isLoggedOut = true;
    }
    else{
        context.message = "Please sign in or register to continue"
        context.isLoggedOut = true;
    }
    context.atForm = true
    context.notAtForm = false
    res.render('form', context)
})


app.get('/', function(req, res){
    var context = {}
    if(req.session.loggedin){
        context.message = "Hey there " + req.session.username;
        context.user = req.session.username;
        context.isLoggedOut = false;
        context.isLoggedIn = true;
    }
    else if(req.session.isRegistered){
        context.message = "You're all signed up " + req.session.regEmail + ". Be even cooler if you signed in.";
        context.isLoggedOut = true;
    }
    else{
        context.message = "Please sign in or register to continue"
        context.isLoggedOut = true;
    }
    context.atForm = false;
    context.notAtForm = true
    res.render('home', context)
});

app.get('/user', function(req, res){
    var context = {}
    if(req.session.loggedin){
        context.message = "Hey there " + req.session.username;
        context.user = req.session.username;
        context.isLoggedOut = false;
        context.isLoggedIn = true;
    }
    else if(req.session.isRegistered){
        context.message = "You're all signed up " + req.session.regEmail + ". Be even cooler if you signed in.";
        context.isLoggedOut = true;
        res.render('home', context);
        return
    }
    else{
        context.message = "Please sign in or register to continue"
        context.isLoggedOut = true;
        res.render('home', context);
        return;
    }
    context.atForm = false;
    context.notAtForm = true
    res.render('user', context);
});

var register = async function(req, res){
    const saltRounds = 10;
    const password = req.body.password;
    const encryptPassword = await bcrypt.hash(password, saltRounds);
    var users = {
        "email":req.body.email,
        "password":encryptPassword
    }
    mysql.pool.query('INSERT INTO Users SET ?', users, function(error, results, fields){
        if(error){
            res.send({
                "code": 400,
                "failed": "error!"
            })
        } else{
            req.session.isRegistered = true
            req.session.regEmail = users["email"]
            res.redirect('/')
        }
    })

}

var login = async function(req, res){
    var email = req.body.email;
    var password = req.body.password;
    mysql.pool.query('SELECT * FROM Users WHERE email = ?', [email], async function(error, results, fields){
        if(error){
            res.send({
                "code":400,
                "failed":"error!"
            })
        } else{
             if(results.length>0){                                                        // bcrypt is a password hashing module that's
                const compare = await bcrypt.compare(password, results[0].password)         // incompatible with OSU's node.js version
                if(compare){                                                                // it breaks our ability to host on the flip server
                    req.session.loggedin = true;                                            // but something should replace it
                    req.session.username = email;
                    req.session.userId = results[0].userId;
                    res.redirect('/')
                } else{
                    res.send({
                        "code":204,
                        "success":"Bad credentials"
                    })
                }
            }
            if(results.length > 0){
                if(password == results[0].password){
                    req.session.loggedin = true;
                    req.session.username = email;
                    res.redirect('/')
                }
                else{
                    res.send({
                        "code": 204,
                        "success": "Bad Credentials"
                    })
                }
            }
            else{
                res.send({
                    "code":206,
                    "success":"Invalid e-mail"
                })
            }
        }
    })
}

router.post('/register', register);
router.post('/login', login);

router.get('/logout', function(req, res, next){
    if(req.session){
        req.session.destroy(function(err){
            if(err){
                return next(err);
            }
            else{
                return res.redirect('/')
            }
        })
    }
})

router.get('/getTopics', function(req, res, next){
    mysql.pool.query('SELECT * FROM Topics', async function(error, result){
        if(error){
            console.log(error)
        }
        else{
            if(result.length > 0){
                res.send(result)
            }
        }
    })
})

router.get('/getUserTopics', function(req, res, next){
    mysql.pool.query('SELECT userId FROM Users WHERE email=?', [req.session.username], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            if(result.length == 1){
                let userId = result[0].userId
                mysql.pool.query('SELECT * FROM UserTopics WHERE userId=?', [userId], function(error, result){
                    if(error){
                        console.log(error)
                    }
                    else{
                        if(result.length > 0){
                            res.send(result)
                        }
                        else{
                            res.send([{"userId": userId}])
                        }
                        }
                    }
                )
            }
        }
    })
})

router.post('/toggleTopic', function(req, res, next){
    var userTopic = {
        "userId":req.session.userId,
        "topicId": req.body.topicId
    }
    mysql.pool.query('SELECT * FROM UserTopics WHERE userId=? AND topicId=?', [userTopic["userId"], userTopic["topicId"]], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            if(result.length == 1){
                mysql.pool.query('DELETE FROM UserTopics WHERE userId=? AND topicId=?', [userTopic["userId"], userTopic["topicId"]], function(error, result){
                    if(error){
                        console.log(error)
                    }
                    else{
                        mysql.pool.query('SELECT * FROM UserTopics WHERE userId=?', [userTopic["userId"]], function(error, result){
                            if(error){
                                console.log(error)
                            }
                            else{
                                res.send(result)
                            }
                        })
                    }
                })
            }
            else{
                mysql.pool.query('INSERT INTO UserTopics SET ?', userTopic, function(error, result){
                    if(error){
                        console.log(error)
                    }
                    else{
                        mysql.pool.query('SELECT * FROM UserTopics WHERE userId=?', [userTopic["userId"]], function(error, result){
                            if(error){
                                console.log(error)
                            }
                            else{
                                res.send(result)
                            }
                        })
                    }
                })
            }
        }
    })
})

router.post('/toggleUserArticle', function(req, res, next){
    var dateTime = new Date();
    var articleId = req.body.articleId;
    var userArticle = {
        "userId": req.session.userId,
        "articleId": articleId,
        "lastViewed": dateTime,
        "userSaved": true
    }
    mysql.pool.query('SELECT * FROM UserArticles WHERE userId=? AND articleId=?', [userArticle["userId"], userArticle["articleId"]], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            if(result.length === 1){
                mysql.pool.query('UPDATE UserArticles SET lastViewed=? WHERE userId=? AND articleId=?', [userArticle["lastViewed"], userArticle["userId"], userArticle["articleId"]], function(error, result){
                    if(error){
                        console.log(error)
                    }
                    else{
                        mysql.pool.query('SELECT * FROM UserArticles WHERE userId=? ORDER BY UserArticles.lastViewed DESC', [userArticle["userId"]], function(error, result){
                            if(error){
                                console.log(error)
                            }
                            else{
                                res.send(result)
                            }
                        })
                    }
                })
            }
            else{
                mysql.pool.query('INSERT INTO UserArticles (userId, articleId, lastViewed) VALUES (?, ?, ?)', [userArticle["userId"], userArticle["articleId"], userArticle["lastViewed"]], function(error, result){
                    if(error){
                        console.log(error)
                    }
                    else{
                        mysql.pool.query('SELECT * FROM UserArticles WHERE userId=? ORDER BY UserArticles.lastViewed DESC', [userArticle["userId"]], function(error, result){
                            if(error){
                                console.log(error)
                            }
                            else{
                                res.send(result)
                            }
                        })
                    }
                })
            }
        }
    })
})

router.get('/getTopicArticles', function(req, res, next){
    var userId = req.session.userId;
    mysql.pool.query('SELECT Articles.*, Topics.name as topic, Authors.*, Periodicals.name as periodicalName, Periodicals.periodicalId as periodicalId' +
    'JOIN ArticleTopics ON Articles.articleId = ArticleTopics.articleId ' +
    'JOIN UserTopics ON ArticleTopics.topicId = UserTopics.topicId ' +
    'JOIN Topics ON ArticleTopics.topicId = Topics.topicId ' +
    'JOIN AuthorArticles ON Articles.articleId = AuthorArticles.articleId ' +
    'JOIN Authors ON AuthorArticles.authorId = Authors.authorId ' +
    'JOIN PeriodicalArticles ON Articles.articleId = PeriodicalArticles.articleId ' +
    'JOIN Periodicals ON PeriodicalArticles.periodicalId = Periodicals.periodicalId ' +
    'WHERE UserTopics.userId = ? ORDER BY Articles.date DESC', [userId], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            res.send(result)
        }
    })
})

router.get('/getTopicArticlesWithConcatTopics', function(req, res, next){
    var userId = req.session.userId
    mysql.pool.query('SELECT Articles.*, GROUP_CONCAT(Topics.name SEPARATOR "&&&") as topic, ' +
    'GROUP_CONCAT(Topics.topicId SEPARATOR "&&&") as topicId, Authors.*, Periodicals.name as ' +
    'periodicalName, PeriodicalArticles.periodicalId as periodicalId, Periodicals.url as periodicalUrl FROM Articles ' +
    'JOIN ArticleTopics ON Articles.articleId = ArticleTopics.articleId ' +
    'JOIN UserTopics ON ArticleTopics.topicId = UserTopics.topicId ' +
    'JOIN Topics ON ArticleTopics.topicId = Topics.topicId ' +
    'JOIN AuthorArticles ON Articles.articleId = AuthorArticles.articleId ' +
    'JOIN Authors ON AuthorArticles.authorId = Authors.authorId ' +
    'JOIN PeriodicalArticles ON Articles.articleId = PeriodicalArticles.articleId ' +
    'JOIN Periodicals ON PeriodicalArticles.periodicalId = Periodicals.periodicalId ' +
    'WHERE UserTopics.userId =? GROUP BY Articles.articleId, Authors.authorId, Periodicals.periodicalId, Periodicals.name ORDER BY Articles.date DESC ', [userId], function(error, result){
        if(error){
            console.log(error)
        } 
        else{
            res.send(result)
        }
    })
})

router.post('/getJustOneTopic', function(req, res, next){
    var topic = req.body.topic
    mysql.pool.query('SELECT Articles.*, GROUP_CONCAT(Topics.name SEPARATOR "&&&") as topic, GROUP_CONCAT(Topics.topicId SEPARATOR "&&&") as topicId, ' +
    'Authors.*, Periodicals.name as periodicalName, PeriodicalArticles.periodicalId as periodicalId, Periodicals.url as periodicalUrl FROM Articles ' +
    'JOIN ArticleTopics ON Articles.articleId = ArticleTopics.articleId ' +
    'JOIN Topics ON ArticleTopics.topicId = Topics.topicId ' +
    'JOIN AuthorArticles ON Articles.articleId = AuthorArticles.articleId ' +
    'JOIN Authors ON AuthorArticles.authorId = Authors.authorId ' +
    'JOIN PeriodicalArticles ON Articles.articleId = PeriodicalArticles.articleId ' +
    'JOIN Periodicals ON PeriodicalArticles.periodicalId = Periodicals.periodicalId ' +
    'WHERE Topics.name = ? GROUP BY Articles.articleId, Authors.authorId, Periodicals.periodicalId, Periodicals.name ORDER BY Articles.date DESC ', [topic], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            res.send(result)
        }
    })
})

router.post('/topicsForSingleArticle', function(req, res, next){
    var articleId = req.body.articleId
    mysql.pool.query('SELECT Topics.name AS topic, Topics.topicId as topicId FROM ArticleTopics ' +
    'JOIN Topics ON ArticleTopics.topicId = Topics.topicId ' +
    'WHERE ArticleTopics.articleId=? ', [articleId], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            res.send(result)
        }
    })
})



router.post('/allTopicsForArticles', function(req, res, next){
    var articleIds = req.body.articleIds
    var topics = req.body.topics
    mysql.pool.query('SELECT ArticleTopics.articleId, GROUP_CONCAT(Topics.name SEPARATOR "&&&") as topics, COUNT(Topics.name) as amount FROM ArticleTopics  ' +
    'JOIN Topics ON ArticleTopics.topicId = Topics.topicId ' +
    'WHERE ArticleTopics.articleId IN (?) AND Topics.name NOT IN (?) GROUP BY ArticleTopics.articleId', [articleIds, topics], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            res.send(result)
        }
    })
})

router.get('/getTopicArticleSources', function(req, res, next){
    var userId = req.session.userId;
    mysql.pool.query('SELECT count(Articles.articleId) as numberOfArticles, Periodicals.name as periodicalName, Periodicals.periodicalId as periodicalId FROM Articles  ' +
    'JOIN ArticleTopics ON Articles.articleId = ArticleTopics.articleId ' +
    'JOIN UserTopics ON ArticleTopics.topicId = UserTopics.topicId ' +
    'JOIN Topics ON ArticleTopics.topicId = Topics.topicId ' +
    'JOIN PeriodicalArticles ON Articles.articleId = PeriodicalArticles.articleId ' +
    'JOIN Periodicals ON PeriodicalArticles.periodicalId = Periodicals.periodicalId ' +
    'WHERE UserTopics.userId = ? GROUP BY Periodicals.periodicalId ', [userId], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            res.send(result)
        }
    })
})

router.get('/getTopicArticleAuthors', function(req, res, next){
    var userId = req.session.userId
    mysql.pool.query('SELECT count(AuthorArticles.articleId) as numberOfArticles, ' +
    'CONCAT(IFNULL(Authors.firstName, ""), " ", IFNULL(Authors.lastName, "")) as authorFullName, ' +
    'AuthorArticles.authorId as authorId FROM Articles ' +
    'JOIN ArticleTopics ON Articles.articleId = ArticleTopics.articleId ' +
    'JOIN UserTopics ON ArticleTopics.topicId = UserTopics.topicId ' +
    'JOIN Topics ON ArticleTopics.topicId = Topics.topicId ' +
    'JOIN AuthorArticles ON AuthorArticles.articleId = ArticleTopics.articleId ' +
    'JOIN Authors ON Authors.authorId = AuthorArticles.authorId ' +
    'WHERE UserTopics.userId = ? GROUP BY AuthorArticles.authorId ', [userId], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            res.send(result)
        }
    })
})

router.post('/addTopic', function(req, res, next){
    var topic = req.body.topic
    var articleId = req.body.articleId
    var newTopic = req.body.newTopic
    var newTopicId
    mysql.pool.query('SELECT * FROM Topics WHERE name=?', [newTopic], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            if(result.length > 0){
                newTopicId = result[0].topicId
                mysql.pool.query('SELECT topicId FROM Topics WHERE name IN (?)', [topic], function(error, result){
                    if(error){
                        console.log(error)
                    }
                    else{
                        var topicId = result[0].topicId
                        mysql.pool.query('INSERT INTO TopicTopics (topicId, relatedTopic) VALUES (?, ?) ON DUPLICATE KEY UPDATE topicId=topicId', [topicId, newTopicId], function(error, result){
                            if(error){
                                console.log(error)
                            }
                            else{
                                mysql.pool.query('INSERT INTO ArticleTopics (articleId, topicId) VALUES (?, ?) ON DUPLICATE KEY UPDATE articleId=articleId', [articleId, newTopicId], function(error, result){
                                    if(error){
                                        console.log(error)
                                    }
                                    else{
                                        mysql.pool.query('INSERT INTO UserTopics (userId, topicId) VALUES (?, ?) ON DUPLICATE KEY UPDATE userId=userId', [req.session.userId, newTopicId], function(error, result){
                                            if(error){
                                                console.log(error)
                                            }
                                            else{
                                                res.send(result)
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            } else{
                mysql.pool.query('INSERT INTO Topics SET name=?',[newTopic], function(error, result){
                    if(error){
                        console.log(error)
                    }
                    else{
                        newTopicId = result.insertId
                        mysql.pool.query('SELECT topicId FROM Topics WHERE name IN (?)', [topic], function(error, result){
                            if(error){
                                console.log(error)
                            }
                            else{
                                var topicId = result[0].topicId
                                mysql.pool.query('INSERT INTO TopicTopics (topicId, relatedTopic) VALUES (?, ?) ON DUPLICATE KEY UPDATE topicId=topicId', [topicId, newTopicId], function(error, result){
                                    if(error){
                                        console.log(error)
                                    }
                                    else{
                                        mysql.pool.query('INSERT INTO ArticleTopics (articleId, topicId) VALUES (?, ?) ON DUPLICATE KEY UPDATE topicId=topicId', [articleId, newTopicId], function(error, result){
                                            if(error){
                                                console.log(error)
                                            }
                                            else{
                                                mysql.pool.query('INSERT INTO UserTopics (userId, topicId) VALUES (?, ?) ON DUPLICATE KEY UPDATE topicId=topicId', [req.session.userId, newTopicId], function(error, result){
                                                    if(error){
                                                        console.log(error)
                                                    }
                                                    else{
                                                        res.send(result)
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                } )
            }
        }
    })
    
})

router.post('/getTopicArticlesFiltered', function(req, res, next){
    var periodicalIds = req.body.periodicalIds
    var articleIds = req.body.articleIds
    var authorIds = req.body.authorIds
    var userId = req.session.userId
    if(periodicalIds.length == 0 || articleIds.length == 0){
        var empty = []
        res.send(empty)
        next()
    }
    else{
        mysql.pool.query('SELECT Articles.*, GROUP_CONCAT(Topics.name SEPARATOR "&&&") as topic, ' +
        'GROUP_CONCAT(Topics.topicId SEPARATOR "&&&") as topicId, Authors.*, Periodicals.name as  ' +
        'periodicalName, Periodicals.periodicalId as periodicalId, Periodicals.url as periodicalUrl FROM PeriodicalArticles ' +
        'JOIN Articles on PeriodicalArticles.articleId=Articles.articleId ' +
        'JOIN ArticleTopics on Articles.articleId=ArticleTopics.articleId ' +
        'JOIN Topics on ArticleTopics.topicId=Topics.topicId ' +
        'JOIN UserTopics on Topics.topicId=UserTopics.topicId ' +
        'JOIN Periodicals on PeriodicalArticles.periodicalId=Periodicals.periodicalId ' +
        'JOIN AuthorArticles on PeriodicalArticles.articleId=AuthorArticles.articleId ' +
        'JOIN Authors on AuthorArticles.authorId=Authors.authorId ' +
        'WHERE Periodicals.periodicalId IN (?) AND Articles.articleId IN (?) AND Authors.authorId IN (?) AND UserTopics.userId=? GROUP BY Articles.articleId, Authors.authorId, Periodicals.periodicalId ORDER BY Articles.date DESC ', [periodicalIds, articleIds, authorIds, userId], function(error, result){
            if(error){
                console.log(error)
            } 
            else{
                res.send(result)
            }
        })
    }
})

router.post('/sendArticleForm', function(req, res, next){
    console.log(req.body)
    var periodicalName = req.body.periodicalName
    var title = req.body.title
    var content = req.body.content
    var date = req.body.date
    var url = req.body.url
    var results = []
    mysql.pool.query('INSERT INTO Periodicals SET name=? ON DUPLICATE KEY UPDATE Periodicals.periodicalId=Periodicals.periodicalId', [periodicalName], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            results.push(result)
            mysql.pool.query("INSERT INTO Articles (title, content, url, date, periodicalId) VALUES (?, ?, ?, STR_TO_DATE(?, '%Y-%m-%d'), (SELECT periodicalId FROM Periodicals WHERE name=?)) " +
            'ON DUPLICATE KEY UPDATE Articles.articleId=Articles.articleId;', [title, content, url, date, periodicalName], function(error, result){
                if(error){
                    console.log(error)
                }
                else{
                    results.push(result)
                    res.send(results)
                }
            })
        }
    })
})

router.post('/sendAuthorForm', function(req, res, next){
    var firstName = req.body.firstName
    var lastName = req.body.lastName
    mysql.pool.query('INSERT INTO Authors (firstName, lastName) VALUES (?, ?) ' +
    'ON DUPLICATE KEY UPDATE Authors.authorId=Authors.authorId', [firstName, lastName], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            res.send(result)
        }
    })
})

router.post('/sendPeriodicalForm', function(req, res, next){
    var periodicalName = req.body.periodicalName
    var periodicalUrl = req.body.periodicalUrl
    mysql.pool.query('INSERT INTO Periodicals (name, url) VALUES (?, ?) ' +
    'ON DUPLICATE KEY UPDATE Periodicals.periodicalId=Periodicals.periodicalId', [periodicalName, periodicalUrl], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            res.send(result)
        }
    } )
})

router.post('/sendFullArticleForm', function(req, res, next){
    var title = req.body.title
    var url = req.body.url
    var content = req.body.content
    var firstName = req.body.firstName
    var lastName = req.body.lastName
    var periodicalName = req.body.periodicalName
    var date = req.body.date
    var topic = req.body.topic
    var results = []
    mysql.pool.query('INSERT INTO Topics SET name = ? ' +
    'ON DUPLICATE KEY UPDATE Topics.topicId=Topics.topicId ', [topic], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            results.push(result)
            mysql.pool.query('INSERT INTO Periodicals SET name=? ' +
            'ON DUPLICATE KEY UPDATE Periodicals.periodicalId=Periodicals.periodicalId', [periodicalName], function(error, result){
                if(error){
                    console.log(error)
                } else{
                    results.push(result)
                    mysql.pool.query("INSERT INTO Articles (title, content, url, date, periodicalId) " +
                    "VALUES (?, ?, ?, STR_TO_DATE(?, '%Y-%m-%d'), " +
                    "(SELECT periodicalId FROM Periodicals WHERE Periodicals.name=?)) " +
                    "ON DUPLICATE KEY UPDATE Articles.articleId=Articles.articleId", [title, content, url, date, periodicalName], function(error, result){
                        if(error){
                            console.log(error)
                        } else{
                            results.push(result)
                            mysql.pool.query('INSERT INTO Authors (firstName, lastName) VALUES (?, ?) ' +
                            'ON DUPLICATE KEY UPDATE Authors.authorId=Authors.authorId', [firstName, lastName], function(error, result){
                                if(error){
                                    console.log(error)
                                }else{
                                    results.push(result)
                                    mysql.pool.query('INSERT INTO ArticleTopics (articleId, topicId) VALUES ' +
                                    '((SELECT articleId FROM Articles WHERE Articles.title=? AND Articles.url=?), ' +
                                    '(SELECT topicId FROM Topics WHERE Topics.name=?))', [title, url, topic], function(error, result){
                                        if(error){
                                            console.log(error)
                                        } else{
                                            results.push(result)
                                            mysql.pool.query('INSERT INTO AuthorArticles (authorId, articleId) VALUES ' +
                                            '((SELECT authorId FROM Authors WHERE Authors.firstName=? AND Authors.lastName=?), ' +
                                            '(SELECT articleId FROM Articles WHERE Articles.title = ? AND Articles.url = ?))', 
                                            [firstName, lastName, title, url], function(error, result){
                                                if(error){
                                                    console.log(error)
                                                } else{
                                                    results.push(result)
                                                    mysql.pool.query('INSERT INTO PeriodicalArticles (periodicalId, articleId) VALUES ' +
                                                    '((SELECT periodicalId FROM Periodicals WHERE Periodicals.name=?), ' +
                                                    '(SELECT articleId FROM Articles WHERE Articles.title = ? AND Articles.url = ?))', 
                                                    [periodicalName, title, url], function(error, result){
                                                        if(error){
                                                            console.log(error)
                                                        } else{
                                                            results.push(result)
                                                            res.send(results)
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    })
})

router.get('/getUserArticlesHistory', function(req, res, next){
    var userId = req.session.userId;
    mysql.pool.query('SELECT Articles.*, UserArticles.lastViewed, GROUP_CONCAT(Topics.name SEPARATOR " | ") as topic FROM Articles ' +
    'JOIN UserArticles ON Articles.articleId = UserArticles.articleId  ' +
    'JOIN ArticleTopics ON Articles.articleId = ArticleTopics.articleId ' +
    'JOIN Topics ON ArticleTopics.topicId = Topics.topicId ' +
    'JOIN UserTopics ON Topics.topicId = UserTopics.topicId ' +
    'WHERE UserTopics.userId = ? GROUP BY Articles.articleId, UserArticles.userId ORDER BY UserArticles.lastViewed DESC', [userId], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            res.send(result)
        }
    })
});

router.post('/setUserReadArticle', function(req, res, next){
    var userId = req.session.userId;
    var articleId = req.body.articleId;
    var dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    mysql.pool.query('INSERT INTO UserArticles (userId, articleId, lastViewed) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE lastViewed=?;', [userId, articleId, dateTime, dateTime], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            res.send(result)
        }
    })
})

router.post('/getJustOneArticle', function(req, res, next){
    var title = req.body.title
    mysql.pool.query('SELECT Articles.*, GROUP_CONCAT(Topics.name SEPARATOR "&&&") as topic, ' +
    'GROUP_CONCAT(Topics.topicId SEPARATOR "&&&") as topicId, Authors.*, Periodicals.name as  ' +
    'periodicalName, Periodicals.periodicalId as periodicalId, Periodicals.url as periodicalUrl FROM PeriodicalArticles ' +
    'JOIN Articles on PeriodicalArticles.articleId=Articles.articleId ' +
    'JOIN ArticleTopics on Articles.articleId=ArticleTopics.articleId ' +
    'JOIN Topics on ArticleTopics.topicId=Topics.topicId ' +
    'JOIN Periodicals on PeriodicalArticles.periodicalId=Periodicals.periodicalId ' +
    'JOIN AuthorArticles on PeriodicalArticles.articleId=AuthorArticles.articleId ' +
    'JOIN Authors on AuthorArticles.authorId=Authors.authorId ' +
    'WHERE Articles.title=? ' +
    'GROUP BY Articles.articleId, Authors.authorId, Periodicals.periodicalId ORDER BY Articles.date DESC', [title], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            res.send(result)
        }
    })
})

router.get('/searchTitles', function(req, res, next){
    var query = req.query.q
    query += "%"
    mysql.pool.query('SELECT Articles.title as title, Articles.url as href FROM Articles WHERE Articles.title LIKE ?', [query], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            var arr = []
            for(i=0;i<result.length;i++){
                arr.push(result[i].title)
            }
            res.send(arr)
        }
    })
})

router.post('/getRelatedTopics', function(req, res, next){
    var topic = req.body.topic
    mysql.pool.query('SELECT TopicTopics.relatedTopic as topicId, Topics.name as topic FROM `TopicTopics` '+
    'JOIN Topics ON TopicTopics.relatedTopic=Topics.topicId ' +
    'WHERE TopicTopics.topicId=(SELECT topicId FROM Topics WHERE name=?)', [topic], function(error, result){
        if(error){
            console.log(error)
        }
        else{
            res.send(result)
        }
    })
})

app.use('/api', router);

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
