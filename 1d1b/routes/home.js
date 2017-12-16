var express = require('express');
var router = express.Router();
const pool = require('../config/db_pool.js');

var session;

router.get('/', async(req, res) =>{
  try{
    console.log('1111111111111');
    var bookId;
    if(!req.query.bookId ){
      bookId = 3;
      res.locals.kind = '오늘의 책';
    }else{
      bookId = req.query.bookId;
      res.locals.kind = '또 다른 책'
    }
    var connection = await pool.getConnection();
    let query = "select * from book where bookId=?";
    var result = await connection.query(query, bookId);

    res.locals.book = result[0];

    console.log(result[0]);

    res.status(200);
    res.render('home');
  } catch(err){
    console.log("###err : ", err.message);
  }finally{
    pool.releaseConnection(connection);
  }
});

module.exports = router;
