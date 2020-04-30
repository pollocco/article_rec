var apiKey = function(){
    console.log("Ask Connor for the API key")
}();
var mysql = require('./dbcon.js')
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const section_name = process.argv[2]

getArticles();

function getArticles(){
    console.log("Fetching articles for topic " + section_name)
    var req = new XMLHttpRequest();
    req.open("GET", `http://api.nytimes.com/svc/search/v2/articlesearch.json?fq=section_name:("${section_name}")&api-key=${apiKey}`, true);
    req.addEventListener('load', function(){
        if(req.status >= 200 && req.status < 400){
            var response = JSON.parse(req.responseText);
            var articles = [];
            var authors = [];
            var topics = [];
            if(response.response.docs.length > 0){
                console.log("Found " + response.response.docs.length + " articles for topic " + section_name + "!")
            }
            for(var i=0; i<response.response.docs.length; i++){
                articles[i] = {
                "title": response.response.docs[i].headline.main,
                "url": response.response.docs[i].web_url,
                "content": response.response.docs[i].abstract,
                "periodicalId": 2,
                "date": response.response.docs[i].pub_date
                }
                if(response.response.docs[i].byline.person[0] && 'firstname' in response.response.docs[i].byline.person[0]){
                    authors[i] = {
                        "firstName": response.response.docs[i].byline.person[0].firstname,
                        "lastName": response.response.docs[i].byline.person[0].lastname
                    }
                }
                else{
                    authors[i] = {
                    "firstName": "Staff",
                    "lastName": "New York Times"
                }}
                topics[i] = {
                    "name": response.response.docs[i].section_name
                }
                console.log(articles[i].title + " | " + authors[i].firstName + " " + authors[i].lastName + " | " + topics[i])
            }
            for(var j=0; j<articles.length; j++){
                promiseArr = [];
                promiseArr[j] = putResponseIntoDatabase(articles[j], authors[j], topics[j])
                Promise.all(promiseArr).then(reply =>{
                    console.log(reply);
                })
            }
            console.log("Current list of authors: ")
            mysql.pool.query('SELECT * FROM Authors', function(error, results){
                if(error){
                    console.log(error)
                }
                else{
                    results.forEach((row) => {
                        console.log(`${row["firstName"]} ${row["lastName"]}: ${row.authorId}`)
                    })
                }
            })
        } else{
            console.log("Error! " + req.statusText);
        }
    })
    req.send();
}

function putResponseIntoDatabase(article, author, topic){
    return new Promise((resolve, reject)=>{
        mysql.pool.query('INSERT IGNORE INTO Topics SET ?', topic, function(error, result){
            if(error){
                return reject(error)
            }
            else{
                    mysql.pool.query('SELECT * FROM Topics WHERE name=?', [topic["name"]], function(error, result){
                        if(error){
                            return reject(error)
                        }
                        else{
                            topic.topicId = result[0].topicId
                            mysql.pool.query('SELECT * FROM Articles WHERE title=? AND url=?', [article["title"], article["url"]], function(error, result){
                                if(error){
                                    return reject(error)
                                }
                                if(result.length > 0){
                                    return
                                }
                                else{
                                    mysql.pool.query('INSERT IGNORE INTO Articles SET ?', article, function(error, result){
                                        if(error){
                                            return reject(error)
                                        }
                                        else {
                                            article.articleId = result.insertId
                                            mysql.pool.query('INSERT IGNORE INTO Authors SET ?', author, function(error, result){
                                                if(error){
                                                    return reject(error)
                                                }
                                                else{
                                                        if(result.insertId > 0){
                                                            author["authorId"] = result.insertId
                                                        }
                                                        mysql.pool.query('SELECT * FROM Authors where firstName=? and lastName=?', [author["firstName"], author["lastName"]], function(error, result){
                                                            if(error){
                                                                return reject(error)
                                                            }
                                                            else{
                                                                if(result[0]){
                                                                    author["authorId"] = (result[0]["authorId"] || author["authorId"])
                                                                }
                                                                var articleTopic = {
                                                                    "articleId": article["articleId"],
                                                                    "topicId": topic["topicId"]
                                                                }
                                                                mysql.pool.query('INSERT IGNORE INTO ArticleTopics SET ?', articleTopic, function(error, result){
                                                                    if(error){
                                                                        return reject(error)
                                                                    }
                                                                    else{
                                                                        var authorArticle = {
                                                                            "authorId": author["authorId"],
                                                                            "articleId": article["articleId"]
                                                                        }
                                                                        mysql.pool.query('INSERT IGNORE INTO AuthorArticles SET ?', authorArticle, function(error, result){
                                                                            if(error){
                                                                                return reject(error)
                                                                            }
                                                                            else{
                                                                                var periodicalArticle = {
                                                                                    "articleId": article["articleId"],
                                                                                    "periodicalId": 2
                                                                                }
                                                                                mysql.pool.query('INSERT IGNORE INTO PeriodicalArticles SET ?', periodicalArticle, function(error, result){
                                                                                    if(error){
                                                                                        return reject(error)
                                                                                    }
                                                                                    else{
                                                                                        resolve("Database updated")
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
                            }
                        })
                    }
                
            }) 
    })
}