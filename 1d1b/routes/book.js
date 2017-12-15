var express = require('express');
var router = express.Router();
const pool = require('../config/db_pool.js');
const fs = require('fs');


router.get('/list', async (req, res)=>{
  try{
    session = req.session;
    var connection = await pool.getConnection();
    let query = ""
    +"select * from book b"
    +" order by (select count(*) from post p where b.bookId=p.bookId) desc";

    let result = await connection.query(query) || [];
    res.locals.list = result;
    res.locals.kind = "여러 권";
    res.preUrl = req.url;
    res.render('book_list');
  }catch(err){
    console.log("Something gones err..\n", err.message);
    alert("문제가 발생하였습니다. 다시 시도해주세요");
    res.status(500).send({message:"err"});
  }finally{
    pool.releaseConnection(connection);
  }
});


module.exports = router;
