var express = require('express');
var router = express.Router();
const pool = require('../config/db_pool.js');

var session;
router.get('/login', async(req, res)=>{
  res.render('login');
});
router.post('/login', async(req, res) =>{
  try{
    var connection = await pool.getConnection();
    var id = req.body.id || '';
    var pw = req.body.pw || '';
    if(id == '' || pw == ''){
      console.log('insert id and pw');
      res.send({code:-1});
    }else{
      var statusCode = 0;
      let query = 'select * from user where userId=? and pwd=?';
      var ret = await connection.query(query, [id, pw]) || [];
      if(ret.length){
        session = req.session;
        // session.now = (new Date()).toUTCString();
        session.userId = id;
        session.name = ret[0].name;
        statusCode = 1;
      }
      res.send({code : statusCode});
    }
  }catch(err){
    console.log('500 err: ', err.message);
    res.send({code : -1});
  }finally{
    pool.releaseConnection(connection);
  }
});

router.get("/logout", function(req,res){
    console.log('=====로그아웃===== '+ (new Date()).toLocaleString());
    session = req.session;
    // 쿠키 지움
    if(session.userId){
        session.destroy(function(err){
            if(err){
                console.log(err);
            }else{
                // 메인화면으로 redirect
                res.redirect('http://127.0.0.1:3000');
            }
        });
    }else{
        // 메인화면으로 redirect
        res.redirect('http://127.0.0.1:3000');
    }

});

router.post('/signup', async(req, res) =>{
  try{
    var connection = await pool.getConnection();
    var id = req.body.id;
    var pwd = req.body.pw;
    var name = req.body.name;
    var email = req.body.email;
    if(!(id && pwd && name && email)){
      console.log('input all data');
      res.send({code: -1});
    }else{
      var statusCode = 0;
      let query = 'select * from user where userId=?';
      var ret = await connection.query(query, id) || [];
      if(ret.length){
        statusCode = 2;
      } else {
        let query2 = 'insert into user set ?';
        let record = {
          userId : id,
          pwd : pwd,
          name : name,
          email : email
        }

        await connection.query(query2, record);
        statusCode = 1;
      }

      res.send({code: statusCode});
    }
  }catch(err){
    console.log('500 err: ', err.message);
    res.send({code : -1});
  }finally{
    pool.releaseConnection(connection);
  }
});

module.exports = router;
