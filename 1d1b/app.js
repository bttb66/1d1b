var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var index = require('./routes/index');
var users = require('./routes/users');
var home = require('./routes/home');
var member = require('./routes/member');
var post = require('./routes/post');
var chat = require('./routes/chat');
var book = require('./routes/book');

var app = express();
app.io = require('socket.io')();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
var rooms = [];
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/vender', express.static(path.join(__dirname, 'public/vender')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

app.use(session({
  secret: 'seceret key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60 * 30000
  }
}));

app.use('/', index);
app.use('/users', users);
app.use('/home', home);
app.use('/member', member)
app.use('/post', post);
app.use('/chat', chat);
app.use('/book', book);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


function changeName(socket, data){
  rooms[socket.room].socket_ids[data] = socket.id;
  socket.nickname = data;
}
app.io.sockets.on('connection', function(socket){

  socket.on('joinRoom', function(data){
    console.log('emit join room, ', data);
    // socket.emit('join', data.room);
    socket.join(data.room);
    console.log('socket.rooms:%j', socket.rooms);
    var room = data.room;
    console.log('emit setRoom: ', room);
    socket.room = room;
    if(rooms[room] == undefined){
       rooms[room] = new Object();
       rooms[room].socket_ids = new Object();
     }

     changeName(socket, data.nickname);
     console.log('emit changename: ', socket.nickname);

     var msg = data.nickname +'님이 채팅방에 입장하셨습니다.';
     app.io.sockets.in(room).emit('broadcast_msg', msg);
     // app.io.sockets.in(id).emit('connect', id);
  });

  socket.on('send_msg', function(data){
    var nick = socket.nickname;
    console.log('%s: %s', socket.nickname, data.msg);
    app.io.sockets.in(socket.room).emit('receive_msg', {msg:data.msg, id:data.id, nickname:socket.nickname});
  });

});

module.exports = app;
