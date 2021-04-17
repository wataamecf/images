// ==UserScript==
// @name         user detail
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.2
// @description  抓取用户数据
// @author       Yonjar
// @include      /^https?:\/\/(chii\.in|bangumi\.tv)\/settings.*$/
// @grant        none
// ==/UserScript==

let fetchHTMLString = (url, fetchMethod = "GET") => {
  let fetchInit = {
    method: fetchMethod,
    cache: "default",
    credentials: "include"
  };

  let aRequest = new Request(url, fetchInit);

  return fetch(aRequest).then(
    resp => resp.text(),
    err => Promise.reject(err)
  );
};

// let fetchPages = function(url, page, max, fetchMethod = "GET") {
//     let fetchInit = {
//         method: fetchMethod,
//         cache: "default",
//         credentials: "include"
//     };

//     if (page <= max) {
//         let aRequest = new Request(url + page, fetchInit);
//         return new Promise((resolve, reject) => {
//             fetch(aRequest)
//                 .then(resp => {
//                     // fetchPages(url, page + 1, max);
//                     resolve(resp.text());
//                 })
//                 .catch(err => reject(err));
//         });
//     }
// };

let fetchPage = function(url, fetchMethod = "GET") {
  let fetchInit = {
    method: fetchMethod,
    cache: "default",
    credentials: "include"
  };

  let aRequest = new Request(url, fetchInit);
  return new Promise((resolve, reject) => {
    fetch(aRequest)
      .then(resp => {
        // fetchPages(url, page + 1, max);
        resolve(resp.text());
      })
      .catch(err => reject(err));
  });
};

let extractHTMLData = (HTMLString, matchRegExp) =>
  HTMLString.match(matchRegExp)[0];

let getPagesNum = dom => {
  let el = dom.lastElementChild.lastElementChild;
  let num = el.textContent;

  if (/\/\s(\d+)/.test(num)) {
    return num.match(/\/\s(\d+)/)[1];
  }

  return !isNaN(num) ? num - 0 : el.previousSibling.textContent - 0;
};

let parseToDOM = str => {
  if (typeof str !== "string") {
    return;
  }

  let parser = new DOMParser();
  let doc = parser.parseFromString(str, "text/html");
  return doc;
};

let removeSelf = el => el.parentNode.removeChild(el);

let robotWork = (sth, time) => {
  let status =
    window.top.document.querySelector("#showrobot").textContent !==
    "显示春菜 ▲";
  if (status) {
    window.top.chiiLib.ukagaka.presentSpeech(`<p>${sth}</p>`);
    return;
  }
  window.top.chiiLib.ukagaka.toggleDisplay();
  window.top.chiiLib.ukagaka.presentSpeech(
    `<p>${sth}</p><p>(本提醒将在${time}秒后关闭)</p>`
  );
  setTimeout(function() {
    window.top.chiiLib.ukagaka.toggleDisplay();
  }, time * 1000);
};

let headerInit = () => {
  let headerUl = document.querySelector("#header ul");
  let aTag = document.createElement("a");
  let liTag = document.createElement("li");
  aTag.setAttribute("href", "javascript:void(0);");
  aTag.addEventListener(
    "click",
    () => {
      for (let a of document.querySelectorAll("#header ul li a")) {
        if (a.classList.contains("selected")) {
          a.classList.remove("selected");
        }
      }
      aTag.className = "selected";
      componentInit();
    },
    false
  );
  aTag.innerHTML = "<span>User Detail</span>";
  liTag.appendChild(aTag);
  headerUl.appendChild(liTag);
};

let componentInit = () => {
  document.querySelector("#header h1").textContent = "User Detail Setting"; // title
  let container = document.querySelector("#columnA");

  // 检测本地数据
  if (!localStorage.getItem("bgm_user_detail_by_yonjar")) {
    robotWork("初次使用需初始化 请勿关闭本页面!", 3);
    let user1 = new User({});
    let todo = [];
    todo.push(user1.fetchChars());
    todo.push(user1.fetchPrns());
    todo.push(user1.fetchFriends());
    todo.push(user1.fetchGroups());
    Promise.all(todo)
      .then(w => {
        localStorage.setItem(
          "bgm_user_detail_by_yonjar",
          JSON.stringify(user1)
        );
        robotWork("初始化完成!", 3);
      })
      .catch(e => robotWork("初始化失败!" + e));
  }

  let localData = JSON.parse(localStorage.getItem("bgm_user_detail_by_yonjar"));
  let user = new User(localData);

  container.innerHTML = `
        <table id="show_table" class="settings" style="text-transform: uppercase;">
            <tr><td>最近更新 / updateTime:</td><td colspan="2">${
              localData ? new Date(localData.updateTime) : "还没更新过呢"
            }</td></tr>
            <tr><td>收藏的角色 / characters:</td><td>${
              localData ? localData.characters.length : 0
            }</td><td><button class="update_btn" data_toUpdate="characters">update</button></td></tr>
            <tr><td>收藏的人物 / persons:</td><td>${
              localData ? localData.persons.length : 0
            }</td><td><button class="update_btn" data_toUpdate="persons">update</button></td></tr>
            <tr><td>好友 / friends:</td><td>${
              localData ? localData.friends.length : 0
            }</td><td><button class="update_btn" data_toUpdate="friends">update</button></td></tr>
            <tr><td>小组 / groups:</td><td>${
              localData ? localData.groups.length : 0
            }</td><td><button class="update_btn" data_toUpdate="groups">update</button></td></tr>
        </table>
    `;

  let table = document.querySelector("#show_table");
  table.addEventListener(
    "click",
    e => {
      let elem = e.target;
      if (elem.tagName.toUpperCase() === "BUTTON") {
        let elParent = elem.parentElement;
        switch (elem.getAttribute("data_toUpdate")) {
          case "characters":
            removeSelf(elem);
            elParent.textContent = "fetching characters...";
            user
              .fetchChars()
              .then(msg => {
                localStorage.setItem(
                  "bgm_user_detail_by_yonjar",
                  JSON.stringify(user)
                );
                elParent.previousSibling.textContent = user.getCount(
                  "characters"
                );
                elParent.textContent = msg;
              })
              .catch(err => (elParent.textContent = err));
            break;
          case "persons":
            removeSelf(elem);
            elParent.textContent = "fetching persons...";
            user
              .fetchPrns()
              .then(msg => {
                localStorage.setItem(
                  "bgm_user_detail_by_yonjar",
                  JSON.stringify(user)
                );
                elParent.previousSibling.textContent = user.getCount("persons");
                elParent.textContent = msg;
              })
              .catch(err => (elParent.textContent = err));
            break;
          case "friends":
            removeSelf(elem);
            elParent.textContent = "fetching friends...";
            user
              .fetchFriends()
              .then(msg => {
                localStorage.setItem(
                  "bgm_user_detail_by_yonjar",
                  JSON.stringify(user)
                );
                elParent.previousSibling.textContent = user.getCount("friends");
                elParent.textContent = msg;
              })
              .catch(err => (elParent.textContent = err));
            break;
          case "groups":
            removeSelf(elem);
            elParent.textContent = "fetching groups...";
            user
              .fetchGroups()
              .then(msg => {
                localStorage.setItem(
                  "bgm_user_detail_by_yonjar",
                  JSON.stringify(user)
                );
                elParent.previousSibling.textContent = user.getCount("groups");
                elParent.textContent = msg;
              })
              .catch(err => (elParent.textContent = err));
            break;
          default:
            // statements_def
            break;
        }
      }
    },
    false
  );
};

class User {
  constructor(json) {
    this.uid = json
      ? json.uid
      : document
          .querySelector("#headerNeue2 > div > div.idBadgerNeue > a")
          .href.split("user/")[1];
    this.charactersList = json ? json.characters : [];
    this.personsList = json ? json.persons : [];
    this.friendsList = json ? json.friends : [];
    this.groupsList = json ? json.groups : [];
    console.log("US: " + this.uid + " init!");
  }

  getCount(str) {
    switch (str) {
      case "characters":
        return this.charactersList.length;
      case "persons":
        return this.personsList.length;
      case "friends":
        return this.friendsList.length;
      case "groups":
        return this.groupsList.length;
      default:
        // statements_def
        break;
    }
  }
  // fetch characters
  fetchChars() {
    return new Promise((resolve, reject) => {
      let charsStr = "";
      let url = `${location.origin}/user/${this.uid}/mono/character`;
      let pagesArray = [];
      let pagesNum = 0;

      fetchHTMLString(url)
        .then(text => {
          let domStr = extractHTMLData(
            text,
            /<div class="page_inner">[\S\s]*?<\/div>/
          );
          let dom = parseToDOM(domStr);
          return Promise.resolve(getPagesNum(dom));
        })
        .then(num => {
          pagesNum = num;

          console.log(`角色表有${num}页待抓取`);

          for (let i = 1; i <= num; i++) {
            pagesArray.push(fetchHTMLString(`${url}?page=${i}`));
          }

          Promise.all(pagesArray).then(pages => {
            let domStr = "";
            pages.forEach((page, i) => {
              console.log(`characters: ${i + 1} / ${pagesNum} start`);
              domStr += extractHTMLData(
                page,
                /<ul class="coversSmall">[\S\s]*?<\/ul>/
              );
              console.log(`characters: ${i + 1} / ${pagesNum} end`);
            });

            let dom = parseToDOM(domStr);
            let li = [...dom.querySelectorAll("li a.l")];
            this.charactersList = li.map(el => el.href.split("/character/")[1]);
            resolve("fetch Characters done!");
          });
        });
    }).catch(err => reject(err));
  }

  // fetch persons
  fetchPrns() {
    return new Promise((resolve, reject) => {
      let prnsStr = "";
      let url = `${location.origin}/user/${this.uid}/mono/person`;
      let pagesArray = [];
      let pagesNum = 0;

      fetchHTMLString(url)
        .then(text => {
          let domStr = extractHTMLData(
            text,
            /<div class="page_inner">[\S\s]*?<\/div>/
          );
          let dom = parseToDOM(domStr);
          return Promise.resolve(getPagesNum(dom));
        })
        .then(num => {
          pagesNum = num;

          console.log(`人物表有${num}页待抓取`);

          for (let i = 1; i <= num; i++) {
            pagesArray.push(fetchPage(`${url}?page=${i}`));
          }
          // pagesArray.push(fetchPages(`${url}?page=`, 1, num));

          Promise.all(pagesArray)
            .then(pages => {
              let domStr = "";
              pages.forEach((page, i) => {
                console.log(`persons: ${i + 1} / ${pagesNum} start`);
                domStr += extractHTMLData(
                  page,
                  /<ul class="coversSmall">[\S\s]*?<\/ul>/
                );
                console.log(`persons: ${i + 1} / ${pagesNum} end`);
              });

              let dom = parseToDOM(domStr);
              let li = [...dom.querySelectorAll("li a.l")];
              this.personsList = li.map(el => el.href.split("/person/")[1]);
              resolve("fetch Persons done!");
            })
            .catch(err => reject(err));
        });
    }).catch(err => reject(err));
  }

  // fetch friends
  fetchFriends() {
    return new Promise((resolve, reject) => {
      let friendsStr = "";
      let url = `${location.origin}/user/${this.uid}/friends`;

      fetchHTMLString(url)
        .then(text => {
          let domStr = extractHTMLData(
            text,
            /<ul id="memberUserList" class="usersMedium">[\S\s]*?<\/ul>/
          );
          let dom = parseToDOM(domStr);
          let li = [...dom.querySelectorAll("a.avatar")];
          this.friendsList = li.map(el => el.href.split("/user/")[1]);
          console.log(this.friendsList);
          resolve("fetch Friends done!");
        })
        .catch(err => reject(err));
    });
  }

  // fetch groups
  fetchGroups() {
    return new Promise((resolve, reject) => {
      let groupsStr = "";
      let url = `${location.origin}/user/${this.uid}/groups`;

      fetchHTMLString(url)
        .then(text => {
          let domStr = extractHTMLData(
            text,
            /<ul id="memberGroupList" class="browserMedium">[\S\s]*?<\/ul>/
          );
          let dom = parseToDOM(domStr);
          let li = [...dom.querySelectorAll("a.avatar")];
          this.groupsList = li.map(el => el.href.split("/group/")[1]);
          console.log(this.groupsList);
          resolve("fetch Groups done!");
        })
        .catch(err => reject(err));
    });
  }

  // to JSON
  toJSON() {
    let now = new Date();
    let userObj = {
      uid: this.uid,
      characters: this.charactersList,
      persons: this.personsList,
      friends: this.friendsList,
      groups: this.groupsList,
      updateTime: now.getTime()
    };

    return userObj;
  }
}

// main
headerInit();
