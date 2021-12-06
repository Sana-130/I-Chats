const express = require('express');
const app = express();
const http = require('http');
const path=require('path');
const socketio = require('socket.io');
const server = http.createServer(app);
const io=socketio(server);

app.use(express.static(path.join(__dirname,'public')));


allusers={}
sockets_list=[]
all_groups={}
//all_groups=[{name:'Python',type:'group', admin:'server'}]
all_groups['Python']={admin:'server', members:[]};
groups_in={}



io.on('connection', socket=>{
  let username

 // }
  socket.on("add user", (data)=>{

    if(data!=" "){
      if(allusers[data]==undefined && data.length<=12){
        allusers[data]={room_no:Date.now(), Socket:socket, banned_grps:[]};
        username=data
      }else{
        socket.emit('username taken', data);
      }
      
    }


  })
  function existence_check(data){
    var already_exists=false
    if(typeof (groups_in[socket.id])!='undefined'){
      groups_in[socket.id].forEach(elem=>{
        if(elem.name== data){
          already_exists=true
        }
      })
    }
    return already_exists
  }
  socket.on('group search', (data)=>{
    
   
      if (all_groups[data]!=undefined && ! allusers[username].banned_grps.includes(data)){
          if(existence_check(data)==false){
            
            function return_groups(){
              var groups_inside=Object.values(groups_in[socket.id])
              var t=[]
              groups_inside.forEach(elem=>{
                t.push(elem.name);
              })
              return t
            }
            function add_members(data){
              all_groups[data].members.push(username);
            }
           
          if (groups_in[socket.id]){
            groups_in[socket.id].push({name: data, type:'group'})
            add_members(data)
    
            socket.join(return_groups());
          }else{
            groups_in[socket.id]=[{name: data, type:'group'}]
            add_members(data)
            socket.join(return_groups());
          }
          console.log("finding a bug", groups_in[socket.id]);
          io.in(data).emit("return data", {list: all_groups[data].members, name:data, admin:all_groups[data].admin} );
          socket.to(data).emit("incoming msg", {message:`${username} has joined the chat`, user:'Bot', group:data})
          socket.emit('update userlist', (groups_in[socket.id]));
      }else{
        socket.emit("already on chat", data);
      }
    }else{
      socket.emit("group not found", data);
    }
  })

  socket.on('person search', (data)=>{
    let already_exists
   console.log(data);

    if(typeof (groups_in[socket.id])!='undefined'){
      groups_in[socket.id].forEach(elem=>{
        if(elem.name== data.name){
          already_exists=true
        }
      })

    }else{
      already_exists=false
    }
    
    if(already_exists!=true){
     
        if (allusers[data.name]!=undefined){
          elem=allusers[data.name]
          socket.join(elem.room_no);
          user_socket=elem.Socket;
          user_socket.join(elem.room_no);
        
          if (groups_in[socket.id]){
            groups_in[socket.id].push({name: data.name , type:'private'})
          
          }else{
            groups_in[socket.id]=[{name: data.name , type:'private'}]
           
          }
          if (groups_in[user_socket.id]){
            groups_in[user_socket.id].push({name: data.user , type:'private'})
          }
          else{
            groups_in[user_socket.id]=[{name: data.user , type:'private'}]
          }
          socket.emit('update userlist', (groups_in[socket.id]));
          io.to(user_socket.id).emit('update userlist', (groups_in[user_socket.id]));
  
          socket.emit('store room_no', {user:data.name, room_no:elem.room_no})
          io.to(user_socket.id).emit('store room_no', {user:data.user, room_no:elem.room_no});
        } else{
          console.log("person doesnt exists", allusers);
          socket.emit("user doesnt exist", data.name);
        }
    }else{
      socket.emit("already on chat", data.name);
    }

   
  })
  socket.on('text messaging', (data)=>{
    var bot_message='';
    //console.log(groups_in[socket.id])
    if(data.command_status==true){
      if(data.command[1]!=''){
      if(all_groups[data.group].admin==username){
        let command=data.command[0];
        let user= data.command[1];
        if(allusers[user]!=undefined){
          let socket_id=allusers[user].Socket.id
        if(command=="#remove_user"){
            all_groups[data.group].members.splice(all_groups[data.group].members.findIndex(inside_elem => inside_elem===user), 1)
            
            io.in(data.group).emit("return data", {list: all_groups[data.group].members, name:data.group, admin:all_groups[data.group].admin} );
            allusers[user].Socket.leave(data.group);
            allusers[user].banned_grps.push(data.group);
            groups_in[socket_id].splice((groups_in[socket_id].findIndex(elem => elem.name === data.group)), 1)
            io.to(socket_id).emit('update userlist', (groups_in[socket_id]));
            bot_message=`Admin removed ${user} from the group`
            allusers[user].Socket.emit("clear chat", {group:data.group, type:'group', content:`<h1>Admin removed you from ${data.group} </h1>`})
          }
          if(command=="#add_user"){
           
            if(allusers[user].banned_grps.includes(data.group)){
              allusers[user].banned_grps.splice(allusers[user].banned_grps.findIndex(inside_elem => inside_elem===data.group), 1)
            }
            io.to(socket_id).emit("add user", data.group);
            bot_message=`Admin added ${user} to the group`
          }
 
        }
        if(command=="#delete_group"){
          if(all_groups[user]!=undefined && user==data.group){
            io.in(data.group).emit("group deletion", data.group);
            io.in(data.group).emit("clear chat", {group:data.group, type:'group', content:`<h1>oops ${data.group} group is deleted by Admin! </h1>`})
            delete all_groups[data.group];
            bot_message=`${data.group} group is deleted`
          }
        }
       
      }else{
        bot_message=`@${username} Only Admin can perform such an action`
      }
    }
    let confirm_group=data.command[1]
    if(data.command[0]=="#leave_group"){
      if(confirm_group==data.group){
        all_groups[confirm_group].members.splice(all_groups[confirm_group].members.findIndex(inside_elem => inside_elem===username), 1)
        io.in(confirm_group).emit("return data", {list: all_groups[confirm_group].members, name:confirm_group, admin:all_groups[confirm_group].admin});
        socket.leave(data.group);  
        groups_in[socket.id].splice((groups_in[socket.id].findIndex(elem => elem.name === data.group)), 1)
        socket.emit('update userlist', (groups_in[socket.id]));
        bot_message=`${username} left the group`
        socket.emit("clear chat", {group:data.group, type:'group', content:`<h1>oops you left the group </h1>`})
      }
    }
    }
    if(bot_message!=''){
      io.in(data.group).emit("incoming msg", {message:bot_message, user:'Bot', group:data.group});
    }else{
      io.in(data.group).emit("incoming msg", {message:data.msg, user:data.user, group:data.group});
    }
    
    
  })

  socket.on('text messaging private', (data)=>{
    io.in(data.room ).emit("incoming msg", {message:data.msg, user:data.user, group:data.person});  
  })
  
  socket.on('clear from groups_in', (data)=>{
    item_to_be_removed={name:data.name, type:data.type}
    
    if(groups_in[socket.id]!=undefined ){
      var index=groups_in[socket.id].findIndex(item => item.name=== data.name);
  
      //groups_in[socket.id].splice((groups_in[socket.id].findIndex(elem => elem.name === item_to_be_removed.name)), 1)
      if(index!=-1){
        groups_in[socket.id].splice(index, 1);
      }
      socket.emit('update userlist', (groups_in[socket.id]));
    }
    
  })
 
  socket.on('fetch members', (data)=>{
    socket.emit('return data', {list: all_groups[data].members, name:data, admin:all_groups[data].admin});
  })


  socket.on('disconnect', ()=>{
    if (typeof (allusers)!='undefined'){
      private=[]
      admin_groups=[]
      member_groups=[]
      if(groups_in[socket.id]!=undefined){
        all=Object.values(groups_in[socket.id])
        all.forEach(elem=>{
          if (elem.type=='private'){
            private.push(allusers[elem.name].Socket.id);
          }
          if(elem.type=='group'){
            if (all_groups[elem.name].admin==username){
              admin_groups.push(elem.name)
            }else if(all_groups[elem.name].members.includes(username)){
              member_groups.push(elem.name)
            }
          }
        })
        
        if(admin_groups.length!=0){
          admin_groups.forEach(elem=>{
            socket.to(elem).emit("group deletion", elem);
            socket.to(elem).emit("clear chat", {group:elem, type:'group', content:`<h1>oops Admin of ${elem} group went offline!! </h1>`})
            delete all_groups[elem];
          })
       
        }
       
        if(member_groups.length!=0){
          member_groups.forEach(elem=>{
            if(all_groups[elem]!=undefined){
            all_groups[elem].members.splice(all_groups[elem].members.findIndex(inside_elem => inside_elem===username), 1)
            socket.to(elem).emit("return data", {list: all_groups[elem].members, name:elem, admin:all_groups[elem].admin});
           
            }
          })
          
        }
      }
      if(private.length!=0){
        socket.to(private).emit('user deletion', username);
        socket.to(private).emit("clear chat", {group:username, type:'private', content:`<h1>oops ${username} went offline </h1>`})
      }

      delete allusers[username];
      if(groups_in[socket.id]!=undefined){
        delete groups_in[socket.id];
      }  
    }
    console.log('user disconnected');
  })

  socket.on('create room', (data)=>{
   var exists=false
  
     if(all_groups[data.group]!=undefined || allusers[data.group]!=undefined){
       socket.emit('same group warn', `group named '${data.group}' already exists`)
       exists=true
     }
     function return_groups(){
      var groups_inside=Object.values(groups_in[socket.id])
      var t=[]
      groups_inside.forEach(elem=>{
        t.push(elem.name);
      })
      return t
     }
    if(exists==false){
      console.log(data.group.length)
      if(data.group.length<=14){

      all_groups[data.group]={admin:data.name, members:[]}
      io.to(socket.id).emit('admin notice', data.group);
      if (groups_in[socket.id]){

        groups_in[socket.id].push({name: data.group, type:'group'})
        socket.join(return_groups());
      }else{

        groups_in[socket.id]=[{name:data.group, type:'group'}]
        socket.join(return_groups());
      }
      console.log(groups_in[socket.id])
      socket.emit('update userlist', (groups_in[socket.id]))
    }else{
      socket.emit("group name long", data.group);
    }
    }else{
      socket.emit("group already exists", data.group);
    }
     
  })
  
  console.log('new Ws connection...', socket.id);  
})

server.listen(3000, () => {
  console.log('listening on *:3000');
});




