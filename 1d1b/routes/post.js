var express = require('express');
var router = express.Router();
const pool = require('../config/db_pool.js');
const fs = require('fs');

var session;

//글 작성
router.get('/', async(req, res)=>{
  res.locals.bookId = req.query.bookId;
  res.render('write');
});
router.post('/', async(req, res) =>{
  try{
    console.log(222222222222);
    var connection = await pool.getConnection();
    var code = 0;
    session = req.session;
    if(!session.userId){
      // location.href = '/login.html';
      code = -1;
      res.send({code:code});
    } else{
      var record = {
        userId : session.userId,
        title : req.body.title,
        content : req.body.contents,
        bookId : req.body.bookId
      };
      var query = 'insert into post set ?';
      var postId = await connection.query(query, record);
      console.log('id: ', postId.insertId);
      res.send({postId:postId.insertId, code:code});
    }
  }catch(err){
    console.log('post write err :', err.message);
  }finally{
    pool.releaseConnection(connection);
  }
});

//글 담기
router.post('/like', async(req, res)=>{
  try{
    var connection = await pool.getConnection();
    if(!session.userId){
      res.render('login');
    }else{
      var userId = req.body.userId;
      var postId = req.body.postId;
      var statusCode = 0;
      let query = 'select count(*) as cnt from like_post where userId=? and postId=?';
      var cnt = connection.query(query, [userId, postId]);
      if(cnt[0].cnt == 0){
        statusCode = 1;
        let query2 = 'insert into like_post set ?';
        let record = {
          postId : postId,
          userId : userId
        };
        connection.query(query2, record);
      }
      res.send({code:statusCode});
    }
  } catch(err){
    console.log('like post err : ', err.message);
    res.status(500).send({message:"err"});
  } finally{
    pool.releaseConnection(connection);
  }
});

//담아온 글 목록
router.get('/like', async(req, res) =>{
  try{
    console.log(1111111111111);
    session = req.session;
    var connection = await pool.getConnection();
    if(!session.userId){
      res.render('login');
    }else{
      let query = "select p.* from post p, like_post l where p.postId=l.postId and l.userId=?";
      let result = await connection.query(query, session.userId) || [];
      res.locals.list = result;
      res.locals.kind = "담아온 글";
      res.preUrl = req.url;
      res.render('list');
    }
  }catch(err){
    console.log("Something gones err..\n", err.message);
    alert("문제가 발생하였습니다. 다시 시도해주세요");
    res.status(500).send({message:"err"});
  }finally{
    pool.releaseConnection(connection);
  }
});

//특정 책의 글 목록
router.get('/list', async(req, res) =>{
  try{
    session = req.session;
    var connection = await pool.getConnection();
    let query = ""
    +"select * from post p where bookId=? "
    +"order by (select count(*) from like_post l where p.postId=l.postId) desc";

    let result = await connection.query(query, req.query.bookId) || [];
    res.locals.list = result;
    res.locals.kind = "그들의 한 권";
    res.preUrl = req.url;
    res.render('list');
  }catch(err){
    console.log("Something gones err..\n", err.message);
    alert("문제가 발생하였습니다. 다시 시도해주세요");
    res.status(500).send({message:"err"});
  }finally{
    pool.releaseConnection(connection);
  }
});


router.get('/mine', async(req, res) =>{
  try{
    session = req.session;
    var connection = await pool.getConnection();
    if(!session.userId){
      res.render('login');
    }else{
      let query = "select * from post where userId=?";
      let result = await connection.query(query, session.userId) || [];
      res.locals.list = result;
      res.locals.kind = "나의 한 권";
      res.preUrl = req.url;
      res.render('list');
    }
  }catch(err){
    console.log("Something gones err..\n", err.message);
    alert("문제가 발생하였습니다. 다시 시도해주세요");
    res.status(500).send({message:"err"});
  }finally{
    pool.releaseConnection(connection);
  }
});

//글 상세보기
router.get('/detail', async(req, res) =>{
  try{
    var connection = await pool.getConnection();
    let query = 'select * from post where postId=?';
    console.log('postId: ', req.query.postId);
    var result = await connection.query(query, req.query.postId) || [];

    let query2 = 'select * from book where bookId=?';
    var result2 = await connection.query(query2, result[0].bookId);
    res.locals.post = result[0];
    res.locals.book = result2[0];
    res.locals.userId = req.session.userId || '';
    console.log('post: ', result);
    res.render('post');
  } catch(err){
    console.log("Something gones err..\n", err.message);
    alert("문제가 발생하였습니다. 다시 시도해주세요");
    res.status(500).send({message:"err"});
  }finally{
    pool.releaseConnection(connection);
  }
});


//글 수정하기 (put으로 할지 post로 할지)
router.get('/update', async(req, res) =>{
  try{

    var connection = await pool.getConnection();
    let query = 'select * from post where postId=?';
    var result = await connection.query(query, req.query.postId) || [];
    res.locals.post = result[0];
    res.render('update');
  } catch(err){
    console.log("Something gones err..\n", err.message);
    // alert("문제가 발생하였습니다. 다시 시도해주세요");
    res.status(500).send({message:"err"});
  }finally{
    pool.releaseConnection(connection);
  }
});
//글 수정하기 (put으로 할지 post로 할지)
router.post('/update', async(req, res)=>{
  try{
    console.log(222222222222);
    var connection = await pool.getConnection();
    var code = 1;
    session = req.session;
    if(!session.userId){
      console.log('00000000');
      res.send({code:0});
      console.log('01010101010');
    } else {
      if(session.userId != req.body.userId){
        code = -1;
        res.send({code:code});
      }else{
        var record = {
          title : req.body.title,
          content : req.body.contents
        };
        var query = 'update post set ? where postId=?';
        var postId = await connection.query(query, [record, req.body.postId]);
        console.log('id: ', postId.insertId);
        res.send({postId:req.body.postId, code:code});
      }
    }
  }catch(err){
    console.log('post write err :', err.message);
    res.status(500).send({message:"err"});
  }finally{
    pool.releaseConnection(connection);
  }
});

router.post('/delete', async(req, res) =>{
  try{
    var connection = await pool.getConnection();
    let query = 'delete from post where postId=?';
    await connection.query(query, req.body.postId);
    res.send({msg:'success'});
  } catch(err){
    console.log("Something gones err..\n", err.message);
    // alert("문제가 발생하였습니다. 다시 시도해주세요");
    res.status(500).send({message:"err"});
  }finally{
    pool.releaseConnection(connection);
  }
});
module.exports = router;
