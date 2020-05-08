//Global bois
var isLoadingBar = false

const PAGE_SIZE = 5
var indexCount = 0
var pagNav = makeNode("nav", [{"className":"pagination"}])
var nextPage = makeNode("a", [{"textContent":"Next"}, {"className":"pagination-next"}])
var prevPage = makeNode("a", [{"className":"pagination-previous"}, {"textContent":"Previous"}])
prevPage.style.visibility = "hidden";
nextPage.style.visibility = "visible";
//

async function postReq(url='', data={}){
  const response = await fetch(url,{
    method: "POST",
    headers:{
      'Content-Type':'application/json'
    },
    body: JSON.stringify(data)
  })
  
  return response.json()
}

async function getReq(url=''){
  const response = await fetch(url)
  return response.json()
}

async function getUserTopics(checkboxes) {
  setLoadingBar(30, "Fetching user topics...");
  var response = await getReq('/api/getUserTopics')
  if(response.length > 0){
    setUserBoxes(response, checkboxes)
    getTopicArticles()
  } else{
    displayNoArticles()
  }
}
async function toggleUserArticle(likeButton) {
  let jsonObj = {
    articleId: likeButton.articleId,
  };
  var response = await postReq('/api/toggleUserArticle', jsonObj).catch(e=>{console.log(e)})
  if(response.length > 0){
    var history = await getReq('/api/getUserArticlesHistory').catch(e=>{console.log(e)});
    makeUserArticleHistorySidebar(history)
  }
  return;
}

async function toggleUserTopic(checkbox) {
  var loader = makeNode("progress", [{"id":"checkboxLoader"}, {"max":"100"}, 
    {"className":"progress is-small is-dark"}, {"textContent":"30%"}])
  checkbox.cell.replaceChild(loader, checkbox)
  let jsonObj = {
    topicId: checkbox.topicId,
  };
  var response = await postReq("/api/toggleTopic", jsonObj)
  checkbox.cell.replaceChild(checkbox, loader)
  checkbox.checked = !checkbox.checked
  if(response.length > 0){
    getTopicArticles()
  } else{
    displayNoArticles();
  }
  return;
}

function makePeriodicalFilter(response){
    makeNode("Table", [{"className":"table is-child"}])
    var checkboxes = []
    checkboxes.response = response;
    var periodicalTable = document.createElement("Table");
    let thead = periodicalTable.createTHead();
    for (i = 0; i < response.length; i++) {
      let row = thead.insertRow();
      row.classList.add("periodicalRow");

      let nameCell = row.insertCell();
      let nameCellText = makeNode("label", [{"innerText":`${response[i].periodicalName}`}])
      nameCell.appendChild(nameCellText);

      let numberOfArticles = row.insertCell();
      let numberOfArticlesText = makeNode("label", [{"innerText":`${response[i].numberOfArticles}`}])
      numberOfArticles.appendChild(numberOfArticlesText);

      let checkboxCell = row.insertCell();

      
      checkboxes[i] = function(x){
          return checkbox = makeNode("input", [{"type":"checkbox"}, {"cell":checkboxCell},{"cellText":nameCellText}, 
          {"name":response[x].periodicalName}, {"id":response[x].periodicalName}, {"checked":"true"}, 
          {"periodicalId":response[x].periodicalId}]);}(i)
      checkboxes[i].addEventListener("click", function (x) {
            return function(){togglePeriodical(checkboxes, checkboxes[x])};
          }(i));
      nameCellText.setAttribute("for", `${response[i].periodicalName}`)

      checkboxCell.appendChild(checkbox);
    }
    var periodicalFilter = clearAllAndReturn("#periodicalFilter");
    periodicalFilter.appendChild(periodicalTable);
}

function setLoadingBar(progress, message){
    if(isLoadingBar){
      document.querySelector("#loadingBar").value = `${progress}`
      document.querySelector("#loadingBar").textContent = `${progress}%`
      document.querySelector("#loadStatusText").textContent = `${message}`
    }
}

function makeTable(response) {
    setLoadingBar(15, "Organizing articles...");
    var checkboxes = [];
    var topicsTable = makeNode("Table", [{"className":"table is-child"}])
    let thead = topicsTable.createTHead();
    for (i = 0; i < response.length; i++) {
        let row = thead.insertRow();
        row.classList.add("topicRow");

        let cell = row.insertCell();

        let cellText = makeNode("label", [{"innerText":response[i].name}])
        cell.appendChild(cellText);

        let checkboxCell = row.insertCell();
        let checkbox = makeNode("input", [{"id":response[i].name}, {"cell":checkboxCell}, {"cellText":cellText}, 
                                  {"topicId":response[i].topicId}, {"articleId":response[i].articleId}, {"name":response[i].name}, {"type":"checkbox"}])

        checkbox.addEventListener("click", function () {
            event.preventDefault();
            toggleUserTopic(checkbox);
        });

        cellText.setAttribute("for", `${response[i].name}`)

        checkboxes.push(checkbox);

        checkboxCell.appendChild(checkbox);
    }
    var myTopics = document.querySelector("#myTopics");
    myTopics.appendChild(topicsTable);
    getUserTopics(checkboxes);
}

function setUserBoxes(response, checkboxes) {
  for (i = 0; i < response.length; i++) {
    for (j = 0; j < checkboxes.length; j++) {
      if (checkboxes[j].topicId == response[i].topicId) {
        checkboxes[j].checked = true;
      }
    }
  }
}

function makeLoadingBar(initial, message){
    let articleList = clearAllAndReturn("#articleList")
    let loadStatusText = makeNode("p", [{"className":"subtitle"}, {"innerText":message}, {"id":"loadStatusText"}])
    let dummyText = makeDummyText()
    let loadingBarDiv = makeNode("div", [{"style":"padding: 60px;"}, {"className":"tile is-parent is-vertical box"}, {"id":"loadingBarDiv"}])
    let loadingBar = makeNode("progress", [{"id":"loadingBar"}, {"className":"progress title"}, {"value":initial}, {"textContent":initial}, {"max":"100"}])
    appendThese(loadingBarDiv, [loadingBar, loadStatusText, dummyText]);
    articleList.appendChild(loadingBarDiv)
    isLoadingBar = true;
}

function displayNoArticles() {
  let articleList = clearAllAndReturn("#articleList");
  isLoadingBar = false

  let articleDiv = makeNode("div", [{"className":"tile is-parent is-vertical box"}, {"style":"padding: 60px; text-align: center;"}])
  let articleDivPara = makeNode("p", [{"className":"title is-5"}, {"innerText":"We don't have any articles for you yet!"}])  
  let articleDivParaSub = makeNode("p", [{"className":"subtitle is-6"}, {"innerText":"Pick some topics to get started"}])

  let pencilIconCol = makeNode("p", [{"className":"columns is-centered"}])
  let pencilIcon = makeNode("icon", [{"id":"noteIcon"}, {"className":"icon column is-centered is-large"}, {"innerText":"📝"}])

  let dummyText = makeDummyText()     //Div will shrink unless it's filled, so filling with invisible text JIC

  pencilIconCol.appendChild(pencilIcon);
  appendThese(articleDivPara, [articleDivParaSub, pencilIconCol])
  appendThese(articleDiv, [articleDivPara, dummyText])
  articleList.appendChild(articleDiv);
}

async function togglePeriodical(checkboxes, checkbox){
  makeLoadingBar(90, "Updating...")
  var loader = makeNode("progress", [{"id":"checkboxLoader"}, {"max":"100"}, 
    {"className":"progress is-small is-dark"}, {"textContent":"30%"}])
  checkbox.cell.replaceChild(loader, checkbox)
  var periodicalIds = []
  var articleIds = []
  for(i=0;i<checkboxes.length;i++){
    if(checkboxes[i].checked == true){
      periodicalIds.push(checkboxes[i].periodicalId)
    }
  }
  console.log(periodicalIds)
  var topicArticles = await getReq("/api/getTopicArticles")
  console.log(topicArticles)
  for(i=0; i<topicArticles.length;i++){
    articleIds.push(topicArticles[i].articleId)
  }
  console.log(articleIds)
  var jsonObj = {}
  jsonObj["periodicalIds"] = periodicalIds
  jsonObj["articleIds"] = articleIds
  var response = await postReq("/api/getTopicArticlesFiltered", jsonObj)
  console.log(response)
  setLoadingBar(99, "Almost there!")
  indexCount = 0;
  checkbox.cell.replaceChild(checkbox, loader)
  paginate(response, 5)
  for(i=0;i<checkboxes.length;i++){
    checkboxes[i].checked = false;
  }
  for(i=0;i<response.length;i++){
    for(j=0;j<checkboxes.length;j++){
      if(response[i].periodicalId == checkboxes[j].periodicalId){
        checkboxes[j].checked = true;
      }
    }
  }
}


function makeUserArticleHistorySidebar(response) {
  var ul = document.createElement("ul");
  if(response.length == 0){
      return;
  }
  for (var i = 0; i < response.length; i++) {
    let title = makeNode("span", [{"innerText":response[i].title}, {"className":"subtitle"}]);
    let linefeed = document.createElement("br");
    title.appendChild(linefeed);
    let content = makeNode("span", [{"className":"content sidebarBlurb"}, {"innerHTML":"<br/>"}])
    content.innerText = response[i].content.substr(0, 100) + " ... ";
    content.innerHTML += "<br/>"
    let link = makeNode("a", [{"innerHTML":"<br/>Read Again <i class='fas fa-share'></i>"}, {"href":response[i].url}, {"target":"_blank"}])
    let lastViewed = document.createElement("span");
    let date = new Date(response[i].lastViewed);
    lastViewed.innerText = `Read: ${date} `;
    lastViewed.className = "last-viewed";
    let li = document.createElement("li");
    appendThese(li, [title, content, lastViewed, link])
    ul.appendChild(li);
  }

  var userArticleHistoryList = clearAllAndReturn("#recent-articles");
  isLoadingBar = false
  userArticleHistoryList.appendChild(ul);
  // getUserTopics(checkboxes);
}

function clearAllAndReturn(query){
    var node = document.querySelector(`${query}`);
    if(node && node.hasChildNodes()){
        for(i=0; i< node.children.length; i++){
            node.removeChild(node.children[i]);
        }
    }
    return node;
}

async function getTopicArticles() {
    makeLoadingBar(80, "Fetching articles...");
    var topicArticles = await getReq("/api/getTopicArticles").catch(e=>{console.log(e)})
    setLoadingBar(90, "Almost there!")
    indexCount = 0;
    paginate(topicArticles, PAGE_SIZE)
    var sources = await getReq("/api/getTopicArticleSources").catch(e=>{console.log(e)})
    makePeriodicalFilter(sources)
}

async function openArticle(id, url) {
  let jsonObj = {
    articleId: id,
  };
  var response = await postReq("/api/setUserReadArticle", jsonObj)
  window.open(url, "_blank");
}

function makeNode(elementType, properties){
    let element = document.createElement(elementType);
    for(m=0; m<properties.length; m++){
        for(let prop in properties[m]){
                element[prop] = properties[m][prop]
        }
    }
    return element
}

function show(page){
  if(page.style.visibility == "hidden"){
    page.style.visibility = "visible"
  }
}

function hide(page){
  if(page.style.visibility == "visible"){
    page.style.visibility = "hidden"
  }
}

function paginate(response, pageSize){
  if(response.length == 0){
    hide(nextPage)
    hide(prevPage)
    displayNoArticles()
  }
  if(indexCount == 0){
    hide(prevPage)
  }
  if(pageSize > response.length){
    makeTopicArticles(response, response.length, indexCount)
    indexCount += response.length
    hide(nextPage)
  }
  if(indexCount + pageSize <= response.length){
    makeTopicArticles(response, pageSize, indexCount)
    indexCount += pageSize;
    if(indexCount == response.length){
      hide(nextPage)
    }
  }
  else if(indexCount < response.length && indexCount + pageSize > response.length){
    let num = response.length % pageSize
    makeTopicArticles(response, num, indexCount)
    hide(nextPage)
    indexCount += num
  }
  nextPage.onclick = function(){
    isLoadingBar = false
    paginate(response, pageSize)
    if(indexCount - pageSize >= 0){
      show(prevPage)
      prevPage.onclick = function(){
        isLoadingBar = false
        handlePrevPage(response, pageSize)
      }
    }
    else{
      hide(prevPage)
      return
    }
  }

  pageDiv = clearAllAndReturn('#pagination')
  pageDiv.style.textAlign = "center"
  pagNav.appendChild(prevPage)
  pagNav.appendChild(nextPage)
  pageDiv.appendChild(pagNav)
}

function handlePrevPage(response, pageSize){
  if(indexCount % pageSize == 0){
    indexCount -= pageSize * 2;
  }
  else{
    indexCount = indexCount - pageSize - (indexCount % pageSize)
  }
  makeTopicArticles(response, pageSize, indexCount)
  indexCount += pageSize;
  if(indexCount - pageSize <= 0){
    hide(prevPage)
    return
  }
  if(indexCount < response.length){
    show(nextPage)
  }
  else{
    hide(nextPage)
  }
}

function appendThese(node, childNodes){
  for(i=0;i<childNodes.length;i++){
    node.appendChild(childNodes[i])
  }
}

async function makeTopicArticles(response, amount, startingIndex) {
  setLoadingBar(90, "Generating list...");

  var list = document.createElement("ul");
  if (response.length == 0) {
    displayNoArticles();
  } else {
        let appender = []
        for (i = startingIndex; i < startingIndex + amount; i++) {
            let listItem = document.createElement("li");
            let topic = makeNode("span", [{"className":"is-size-7 is-uppercase is-block"}, {"innerText":response[i].topic}])
            let articleTitle = makeNode("p", [{"className":"article-title is-size-5 has-text-weight-bold has-text-dark"}, {"innerText":response[i].title}])
            let articleContent = makeNode("p", [{"className":"article-content is-size-6 has-text-grey-dark"}, {"innerText":response[i].content}])
            let periodical = makeNode("a", [{"innerText":response[i].periodicalName}, {"href":response[i].periodicalUrl}, {"target":"_blank"}, {"className":"periodical is-size-6 has-text-dark"}])
            let author = makeNode("span", [{"className":"author is-size-6 has-text-dark"}])
            author.innerText = ` ${response[i].firstName} ${response[i].lastName}`;

            let articleDate = makeNode("span", [{"style":"font-family: 'EB Garamond', Georgia, Times, serif;"}, {"className":"article-date is-size-6 has-text-dark"}])
            let articleDateText = document.createElement("span");
            articleDate.innerText = response[i].date.substring(0, 10);
            articleDateText.appendChild(articleDate);
            
            let readButton = makeNode("a", [{"style":"padding-right: 20px;"}, {"url":response[i].url}, {"articleId":response[i].articleId}, {"innerHTML":"Read <i class='fas fa-share'></i>"}])
            readButton.addEventListener("click", async function () {
                window.open(readButton.url, "__blank");
                toggleUserArticle(readButton);
                var userHistory = await getReq("/api/getUserArticlesHistory")
                makeUserArticleHistorySidebar(userHistory)
            });
           
            appender.push(function(a, b, c, d, e, f, g){
              return function(){appendThese(listItem, [a, b, c, d, e, f, g])}
            }(topic, articleTitle, articleContent, periodical, author, articleDateText, readButton));
            let listItemDiv = makeNode("div", [{"className":"tile is-parent is-vertical box"}, {"id":"listItemDiv"}, 
            {"periodicalId":response[i].periodicalId}, {"articleId":response[i].articleId}])
            
            listItemDiv.appendChild(listItem);
            list.appendChild(listItemDiv);
        }
        for(j=0; j<appender.length; j++){
          appender[j]()
        }
        let dummyText = makeDummyText()
        let icon = makeNode("icon", [{"innerText":"📰"}, {"className":"icon column is-centered is-large"}, {"id":"noteIcon"}])
        let iconCol = makeNode("p", [{"className":"columns tile is-parent"}, {"id":"iconCol"}])

        iconCol.appendChild(icon)
        appendThese(list, [iconCol, dummyText])
        var articleList = clearAllAndReturn("#articleList");
        articleList.appendChild(list);   
    }
}

function makeDummyText(){                               // Invisible text to prevent the article list from shrinking 
    let dummyText = document.createElement('div')       //    when all the articles are gone. 
    for(i=0;i<65;i++){
      dummyText.textContent += "x"
    }
    dummyText.className = "title";
    dummyText.style.visibility = "hidden"
    return dummyText
}

function bindResetButton(){
  var reset = document.querySelector("#resetButton")
  reset.addEventListener("click", function(){
    getTopicArticles()
  })
}

//ENTRY POINT
document.addEventListener("DOMContentLoaded", async function(){
  var sources = await getReq("/api/getTopicArticleSources")
  makePeriodicalFilter(sources)
  makeLoadingBar(10, "Booting up the mainframe...")
  var topics = await getReq("/api/getTopics")
  makeTable(topics)
  var userHistory = await getReq("/api/getUserArticlesHistory")
  makeUserArticleHistorySidebar(userHistory)
  bindResetButton()
})

//The island of unhappy code

//let date = new Date(response[i].date)
//let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date)    // Date is not finite. I think it's a database issue.
//let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
//let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date)
//articleDate.innerText = `${month} ${day} ${year} `;

/* let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date) // Same thing here.
let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date) */
//let date = response[i].lastViewed.substr(0, 10)





