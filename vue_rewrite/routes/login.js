var mysql = require('../dbcon.js');
var bcrypt = require('bcrypt');
var article = require('../article.js')

exports.register = async function(req, res){
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
            req.session.loggedin = true;
            req.session.username = email;
            res.redirect('home')
        }
    })

}

exports.login = async function(req, res){
    var email = req.body.email;
    var password = req.body.password;
    mysql.pool.query('SELECT * FROM Users WHERE email = ?', [email], async function(error, results, fields){
        if(error){
            res.send({
                "code":400,
                "failed":"error!"
            })
        } else{
            if(results.length>0){
                const compare = await bcrypt.compare(password, results[0].password)
                if(compare){
                    res.send({
                        "code":200,
                        "success":"login 200"
                    })
                } else{
                    res.send({
                        "code":204,
                        "success":"Bad credentials"
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