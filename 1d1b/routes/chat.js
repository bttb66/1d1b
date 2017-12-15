var express = require('express');
var router = express.Router();
const pool = require('../config/db_pool.js');
const fs = require('fs');

router.get('/', async (req, res) =>{
  try{
    if(!req.session.userId){
      res.render('login');
    }else{
      var connection = await pool.getConnection();
      let query = 'select * from book where bookId=?';
      var ret = await connection.query(query, 1);
      res.locals.book = ret[0];
      res.locals.nickname = req.session.name;
      res.locals.id = req.session.userId;
      res.render('chat');
    }
  }catch (err){
    console.log("Something gones err: ", err.message);
  }finally{
    pool.releaseConnection(connection);
  }
});

module.exports = router;
