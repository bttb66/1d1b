var express = require('express');
var router = express.Router();
const pool = require('../config/db_pool.js');
const fs = require('fs');
const rp = require('request-promise');
const apiKey = require('../config/apiKey.js');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
const qs = require('querystring');

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

router.get('/search', async(req, res)=>{
  res.locals.list=[];
  res.render('search');
});

router.post('/search', async(req, res)=>{
  var options = {
       method: 'GET',
       url: 'https://openapi.naver.com/v1/search/book_adv.xml?d_titl='+qs.escape(req.body.searchKey),
       headers: {
         'X-Naver-Client-Id': apiKey.clientId,
         'X-Naver-Client-Secret': apiKey.clientSecret,
         'Content-Type':'multipart/form-data'
       }
   };

   rp(options)
     .then(function(parsedBody){
       parser.parseString(parsedBody, function(err, result) {
        console.log(result.rss.channel[0].item[0].title[0]);
        res.locals.list = result.rss.channel[0].item;
        res.render('search');
      });

     })
     .catch(function (err) {
      console.log('naver api err: ', err);
      res.status(500).send({message:"naver api err"});
    });
});

router.post('/register', async(req, res)=>{
  try{
    var code = 0;
    var connection = await pool.getConnection();
    var bookId = req.body.isbn;
    console.log(decodeURI(req.body.sum));
    let query = 'select count(*) as cnt from book where bookId=?';
    var cnt = await connection.query(query, bookId);
    if(cnt[0].cnt != 0){
      code = 2;
    }else{
      let query2 = 'insert into book set?';
      let record = {
        bookId : bookId,
        title : req.body.title,
        writer : req.body.writer,
        img : req.body.img,
        link : req.body.link,
        sum : decodeURI(req.body.sum)
      };
      await connection.query(query2, record);
      code = 1;
    }
    res.send({code:code, bookId:bookId});
  }catch(err){
    console.log('book register err : ', err.message);
    res.status(500).send({msg:'server err'});
  }finally{
    pool.releaseConnection(connection);
  }
});

module.exports = router;
