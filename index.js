const express = require("express");
var http = require("http");
const app = express();
const port = process.env.PORT || 5000;
var server = http.createServer(app);
var io = require("socket.io")(server);
var mysql = require('mysql');
var router = express.Router();

//middlewre
app.use(express.json());
var clients = {};

var con = mysql.createConnection({
  host: "192.168.20.44",
  user: "DreamCloudDB",
  password: "D88XRejiTDDWah8H"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");


});




app.get('/', function(req, res,next) {   
    //now you can call the get-driver, passing a callback function
    con.query("SELECT * FROM DreamCloudDB.SnapperAppAudits LIMIT 1",
            function (err, rows) {
                if (err) {
                console.log(err);
                }

                console.log(rows); // query result looks fine as JSON object
                res.send(rows);
            }
        );  
});



io.on("connection", (socket) => {
  console.log("connetetd");
  console.log(socket.id, "has joined");
  socket.on("writing" , (detail) => {
    console.log(detail);
  });
  socket.on("signin", (id) => {
    let command = `Update DreamCloudDB.MessengerKullanicilari SET mk_socketUuid = '${socket.id}' WHERE  mk_firebaseUuid = '${id}';`;
    con.query(command,
            function (err, result)  {
              if (err) throw err;
              console.log("socket id updated");
            }
            );
     con.query(`SELECT * FROM DreamCloudDB.GeciciMesajlar WHERE mesaj_targetId = '${id}'`, function (err, result, fields) {
    if (err) throw err;
    console.log(result);
    for (var i=0; i<result.length; i++){
      socket.emit("message",
        {"message": result[i].mesaj_detail, "sourceUuid": result[i].mesaj_sourceId, "targetUuid": result[i].mesaj_targetId,"name" : "name"});
        con.query(`DELETE FROM DreamCloudDB.GeciciMesajlar WHERE mesaj_id = '${result[i].mesaj_id}'`,
            function (err, result)  {
              if (err) throw err;
              console.log("1 record inserted");
            }
            );
    }
  });
    console.log(id);
    clients[id] = socket;
    console.log(clients);
  });
  socket.on("disconnect",(exp)  => {
    console.log(`disconnect"+${exp}+${socket.id}+${clients[socket.id]}`);
    let command = `SELECT mk_firebaseUuid FROM DreamCloudDB.MessengerKullanicilari  WHERE  mk_socketUuid = '${socket.id}';`;
    con.query(command,
            function (err, result, fields)  {
              if (err) throw err;
              console.log(result[0].mk_firebaseUuid);
              clients[result[0].mk_firebaseUuid] = null;
            }
            );
  });
  socket.on("message", (msg) => {
    console.log(msg);
    let targetUuid = msg.targetUuid;
    if (clients[targetUuid]) {
      clients[targetUuid].emit("message", msg);
    }else{
      let command = `INSERT INTO DreamCloudDB.GeciciMesajlar SET mesaj_sourceId = '${msg.sourceUuid}',mesaj_targetId = '${msg.targetUuid}', mesaj_detail = '${msg.message}';`;
    console.log(command);
    console.log(msg.targetUuid);
    con.query(command,
            function (err, result)  {
              if (err) throw err;
              console.log("1 record inserted");
            }
            );
    }/*
    let command = `INSERT INTO DreamCloudDB.GeciciMesajlar SET mesaj_sourceId = '${msg.sourceId}',mesaj_targetId = '${msg.targetUuid}', mesaj_detail = '${msg.message}';`;
    console.log(command);
    console.log(msg.targetUuid);
    con.query(command,
            function (err, result)  {
              if (err) throw err;
              console.log("1 record inserted");
            }
            );  */
  });
});
io.on("disconnect",(socket)  => {
    console.log("disconnectttt");
  });
server.listen(port, "0.0.0.0", () => {
  console.log("server started");
});
