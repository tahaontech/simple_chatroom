const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

// Get User name and room from url
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});


// states
let current = room;
const RoomMessageState = [];
let Users = [];
let UserMessageState = {};
// const UserMessageState = {
//     "taha": {
//         id: user.id,
//         messages: []
//     }
// };

const socket = io();

// Join the Room
socket.emit("joinRoom", { username, room });

// Get room & users
socket.on("roomUsers", ({ room, users }) => {
  outPutRoomName(room);
  outPutUsers(users);
});

// Message from server
socket.on("message", (msg) => {
  console.log(msg);
  outPutMessage(msg);
  //   store room messages
  RoomMessageState.push(msg);

  // scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// message from users
socket.on('userMessage', (from, msg) => {
  console.log(from.username, msg)
    
    UserMessageState[from.username].messages.push(msg);
    if (current.id === from.id) {
      outPutMessage(msg)
    } else {
      // TODO: show a toast
    }
})

// message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const msg = e.target.elements.msg.value;
  if (current === room) {
    // chat to the room
    socket.emit("chatMessage", msg);
  } else {
    // chat to the user
    socket.emit("chatMessageUser", { toUser: current.id, msg: msg });
  }

  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

function outPutMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;

  document.querySelector(".chat-messages").appendChild(div);
}

function cleanMessages() {
  document.querySelector(".chat-messages").innerHTML = "";
}

function outPutRoomName(room) {
  roomName.innerText = room;
}

function outPutUsers(users) {
  // init or update userstates
  updateUserStates(users);

  userList.innerHTML = `
        ${users
          .map((user) => {
            if (user.username !== username) {
              return `<li><button onclick="changeCurrentChat('${user.username}')">${user.username}</button></li>`;
            } else {
              return `<li><button disabled>${user.username}</button></li>`;
            }
          })
          .join("")}
    `;
}

function changeCurrentChat(name = room) {
  console.log("call change", name);
  if (name === current) {
    return;
  }

  cleanMessages();

  // load room data
  if (name === room) {
    RoomMessageState.forEach((msg) => {
      outPutMessage(msg);
    });
    current == room;
    return;
  }

  // load user messages
  UserMessageState[name].messages.forEach((msg) => {
    outPutMessage(msg);
  });
  current = Users.find((u) => u.username === name);
  return;
}


function updateUserStates(users) {
  let difference = users.filter(x => !Users.includes(x));
  if (difference.length > 0) {
    difference.forEach((u) => {
      UserMessageState[u.username] = {
        id: u.id,
        messages: [],
      }
    })

    Users = users;
  }
}