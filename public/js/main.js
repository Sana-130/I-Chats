
const socket = io();
var all_chats={}
var room_no={}

var username

const url=new URLSearchParams(location.search);
for (const[key, value] of url){
  username=value
}

if(username!=''){
  socket.emit("add user", username);
}else{
  location.replace("http://127.0.0.1:3000/intro.html");
}


socket.on('username taken', (data)=>{
  location.replace("http://127.0.0.1:3000/intro.html");
})

var unread_msg={}
var reserved_commands=["#remove_user", "#add_user", "#leave_group"];
var current_group
var current_type

var form_group= document.getElementById('form');
var group_name= document.getElementById('group_name');

var form_search=document.getElementById('form_search');
var receiver=document.getElementById('p/g_name');
var chat_form=document.getElementById('chat_form');
var chat_text=document.getElementById('chat_text');

var person_search=document.getElementById('person_search');
var person_name=document.getElementById('person_name');

form_search.addEventListener('submit', function(e){
  e.preventDefault();
  if (receiver.value){
    socket.emit('group search', receiver.value);
    console.log(receiver.value);
    receiver.value='';
  }
});

person_search.addEventListener('submit', function(e){
  e.preventDefault();
  if (person_name.value){
    if(person_name.value!=username){
      socket.emit('person search', {name: person_name.value, user:username});
    }
    console.log( person_name.value);
    person_name.value='';
  }
});


form_group.addEventListener('submit', function(e){
  e.preventDefault();
  if (group_name.value){
    console.log("the group nameeeeee", current_group, username, group_name.value);
    socket.emit('create room', {group: group_name.value, name:username });
    form_group.reset();
    
  }
});

var ul_list=document.getElementById("ul_list");
const app= document.getElementById("user__item");
const chat_box=document.getElementById("chat_msg");
const type_area=document.getElementById("type_area");
const members=document.getElementById("members__div");
const member_div=document.getElementById("members__sidebar");
const admin=document.getElementById("admin");
const member_len=document.getElementById("total_people")

socket.on('add user', (data)=>{
  socket.emit('group search', data);
})

function return_members(data){

  var mem=member_div.style.visibility
  if(data.name==current_group && mem==="visible"){
    members.innerHTML='';
    admin.innerHTML="Admin" + ' : ' + data.admin;
    member_len.innerHTML=data.list.length;
    if(data.list.length!=0){
      data.list.forEach(elem=>{
        createHtml(elem);
      })
    }
  }
  console.log(mem, data.admin);
  function createHtml(data){
    console.log("the data", data);
    //all_chats[data]=[{name:'bot', msg:'welcome'}];
    const content=`<div class="member__name" data-member-name="${data}" ><h6>${data}</h6></div><hr>`
    members.insertAdjacentHTML("beforeend", content);
    console.log("check33333")
   
  } 
}

socket.on('return data', (data)=>{
  return_members(data);
})


socket.on('already on chat', (data)=>{
  document.getElementById(`${data}`).click();
})

//alert messages
socket.on("group name long", (data)=>{
  var content=`<div class="alert alert-dismissible alert-primary">
  <h4 class="alert-heading">${data} group name too long!</h4>
  <p class="mb-0">try naming something else</p>
  </div>`
  chat_box.innerHTML=content
})

socket.on('group not found', (data)=>{
  var content=` <div class="alert alert-dismissible alert-primary">
  <h4 class="alert-heading">${data} group is not found!</h4>
  <p class="mb-0">try searching something else</p>
  </div>`
  chat_box.innerHTML=content
})

socket.on('user doesnt exist', (data)=>{
  var content=` <div class="alert alert-dismissible alert-warning">
  <h4 class="alert-heading">user ${data} is not found!</h4>
  <p class="mb-0">try searching for someone else.</p>
  </div>`
  chat_box.innerHTML=content
})

socket.on('group already exists', (data)=>{
 var content=` <div class="alert alert-dismissible alert-info">
  <h4 class="alert-heading">The Group ${data} already exists!</h4>
  <p class="mb-0">try naming something else.</p>
  </div>`
  chat_box.innerHTML=content

})

//userlist updating
socket.on('update userlist', (data)=>{
 app.innerHTML='';
  if (!all_chats[current_group]){

    all_chats[current_group]=[{name:'Bot', msg:'welcome'}];
  }
  
  console.log("nothing wrong on the update userlist function");
  data.forEach(elem=>{
    createHtml(elem);
  })
  listen();
})

  function createHtml(data){
    var num=''
    if(unread_msg[data.name]!=undefined){
      num=unread_msg[data.name];
    }
    if(data.type=="group"){
      var content=`<div class="list-group-item d-flex justify-content-between align-items-center" data-user-name="${data.name}" data-type="${data.type}" id="${data.name}">
      ${data.name} <i class="material-icons">groups</i><span class="badge bg-primary rounded-pill" id="unread">${num}</span></div>`
    }else if(data.type=="private"){
      var content=`<div class="list-group-item d-flex justify-content-between align-items-center" data-user-name="${data.name}" data-type="${data.type}" id="${data.name}">
      ${data.name} <span class="badge bg-primary rounded-pill" id="unread">${num}</span></div>`
    }
   
    app.insertAdjacentHTML("beforeend", content);
   
  }
  
  function listen(){
    app.querySelectorAll(".list-group-item").forEach(user_item=>{
    user_item.addEventListener("click", ()=>{
      var gp_name=user_item.getAttribute("data-user-name");
      var type=user_item.getAttribute("data-type");
      current_type=type
      current_group=gp_name
  
      if(type=='group'){
        socket.emit('fetch members', current_group);
        member_div.style.visibility="visible";
      }else if(type=='private'){
        member_div.style.visibility="hidden";
      }
    if(typeof (all_chats[gp_name])!='undefined'){
      if (all_chats[gp_name].length>=0 ){
        if (typeof (unread_msg[gp_name])!='undefined') {
          unread_msg[gp_name]=0;
          var x=document.querySelector(`#${gp_name} span`)
          x.innerHTML='';
        }
        chat_box.innerHTML='';
        var chats=all_chats[gp_name]
        chats.forEach(elem=>{
        const content=`<p>${elem.name} : ${elem.msg}</p>`
        chat_box.insertAdjacentHTML("beforeend", content);
        })
        type_area.style.visibility="visible"; 
      } //  })
    }
    else{
      if(current_type=='group'){
        all_chats[gp_name]=[{name:'bot', msg:`welcome, ${username}`}];
      }else if(current_type=='private'){
        all_chats[gp_name]=[{name:'bot', msg:`start a chat with ${gp_name}`}];
      }
      
      chat_box.innerHTML='';
      all_chats[gp_name].forEach(elem=>{
        const content=`<p>${elem.name} : ${elem.msg}</p>`
        chat_box.insertAdjacentHTML("beforeend", content);
        })
      type_area.style.visibility="visible";
    }
    })
  })
}

//text message handling
chat_form.addEventListener('submit', function(e){
  e.preventDefault();
  if (chat_text.value){
  
    if (current_type=='private'){
      var room=room_no[current_group];
      socket.emit('text messaging private', {msg:chat_text.value, room:room, user:username, person:current_group});
      chat_text.value='';
    }
    else if(current_type=='group'){
      let commands_executed=false
      let command=null
      var t=chat_text.value.split(" ");
      if(reserved_commands.includes(t[0])){
        t=t.splice(0, 2);
        if(t[1]!=''){
          commands_executed=true
          command=t
        }
      }
      socket.emit('text messaging', {msg:chat_text.value, group:current_group, user:username, command_status:commands_executed, command:command});
      chat_text.value='';
    }   
  }
});

//user deletion
socket.on('user deletion', (data)=>{

  if(all_chats[data]!=undefined){
    delete all_chats[data]
  }
  if(room_no[data]!=undefined){
    delete room_no[data]
  }
  socket.emit('clear from groups_in', {name: data, type:'private'});
})

//group deletion
socket.on('group deletion', (data)=>{
  console.log(data,"ruunning from it ");
  if(all_chats[data]!=undefined){
    delete all_chats[data]
  }
  socket.emit('clear from groups_in', {name:data, type:'group'})
})

//private messaging room no
socket.on('store room_no', (data)=>{
  room_no[data.user]=data.room_no;
})


socket.on('incoming msg', (data)=>{

  var send_user=data.group
  var msg_user=data.user

    if(send_user==username){
      send_user=data.user
    }else{
      send_user=data.group
    }
 
    if (send_user!=current_group){
      if (typeof (unread_msg[send_user])!='undefined' ){
        unread_msg[send_user]+=1;
      }
      else{
        unread_msg[send_user]=1;
      }
  
      var x=document.querySelector(`#${send_user} span`);
    
       x.innerHTML=`${unread_msg[send_user]}`;
    }
    if(msg_user==username){
      msg_user="You"
    }
    
    if (all_chats[send_user]){
      all_chats[send_user].push({name:msg_user, msg:data.message});
    }
    else{
      all_chats[send_user]=[{name:msg_user, msg:data.message}];
    }
    const content=`<p>${msg_user} : ${data.message}</p>`
    if (send_user==current_group){
      chat_box.insertAdjacentHTML("beforeend", content);
    }
    console.log(data);

})

//clearing the chat screen when the user or group is gone.
socket.on("clear chat", (data)=>{
  if(current_group==data.group){
    if(data.type=="group"){
      members.innerHTML=''
      member_div.style.visibility="hidden";
      chat_box.innerHTML=data.content;
      type_area.style.visibility="hidden";
    }else{
      chat_box.innerHTML=data.content;
      type_area.style.visibility="hidden";
    }
    
  }
})

