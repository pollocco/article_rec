var isLoadingBar = false

function callServer(reqType, url, [responseCallback], loadAmount, loadMessage){
    if(loadAmount && loadMessage){
        makeLoadingBar(loadAmount, loadMessage)
    }
    var req = new XMLHttpRequest();
    req.open(reqType, url, true);
    req.addEventListener("load", function(){
        if(req.status >= 200 && req.status < 400){
            var response = JSON.parse(req.responseText);
            for(i=0; i<responseCallback.length; i++){
                responseCallback(response);
            }
        } else {
            console.log("Error! " + req.statusText);
        }
    })
    req.send();
}

function getResponse(req){
  if(req.status >= 200 && req.status < 400){
    var response = JSON.parse(req.responseText)
    return response
  }
  else{
    return console.log("Error! " + req.statusText)
  }
}

function createServerRequest(reqType, url, myCallback, ...params){
  var req = new XMLHttpRequest();
  req.open(reqType, url, true);
  if(params[1]){
    req.setRequestHeader("Content-Type", "application/json");
  }
  req.addEventListener("load", function(){
    response = getResponse(req)
    myCallback(response, params)
  })
  req.send(params[1])
}

function toggleUserArticle(likeButton) {
  var req = new XMLHttpRequest();
  req.open("POST", "/api/toggleUserArticle", true);
  req.setRequestHeader("Content-Type", "application/json");
  req.addEventListener("load", function () {
    if (req.status >= 200 && req.status < 400) {
      var response = JSON.parse(req.responseText);
      if (response.length > 0) {
        callServer("GET", "/api/getUserArticlesHistory", [makeUserArticleHistorySidebar])
      }
    } else {
      console.log("Error! " + req.statusText);
    }
  });
  let jsonObj = {
    articleId: likeButton.articleId,
  };
  req.send(JSON.stringify(jsonObj));
  return;
}

function toggleUserTopic(checkbox) {
  var loader = makeNode("progress", [{"id":"checkboxLoader"}, {"max":"100"}, {"className":"progress is-small is-dark"}, {"textContent":"30%"}])
  checkbox.cell.replaceChild(loader, checkbox)
  let jsonObj = {
    topicId: checkbox.topicId,
  };
  createServerRequest("POST", "/api/toggleTopic", function(){
    checkbox.cell.replaceChild(checkbox, loader)
      checkbox.checked = !checkbox.checked;
      if (response.length > 0) {
        getTopicArticles(response);
      } else {
        displayNoArticles();
      }
  }, checkbox, JSON.stringify(jsonObj))
  return;
}

function getUserTopics(checkboxes) {
  setLoadingBar(30, "Fetching user topics...");
  createServerRequest("GET", "/api/getUserTopics", function(){
    if (response.length > 0) {
      setUserBoxes(response, checkboxes);
      getTopicArticles(response);
  } else {
      displayNoArticles();
  }
  }, checkboxes)
}

function makePeriodicalFilter(response){
    makeNode("Table", [{"className":"table is-child"}])
    var periodicalTable = document.createElement("Table");
    let thead = periodicalTable.createTHead();
    for (i = 0; i < response.length; i++) {
      let row = thead.insertRow();
      row.classList.add("periodicalRow");

      let nameCell = row.insertCell();
      let nameCellText = makeNode("label", [{"innerText":`${response[i].periodicalName}`}, {"for":response[i].periodicalName}])
      nameCell.appendChild(nameCellText);

      let numberOfArticles = row.insertCell();
      let numberOfArticlesText = makeNode("label", [{"innerText":`${response[i].numberOfArticles}`}])
      numberOfArticles.appendChild(numberOfArticlesText);

      let checkboxCell = row.insertCell();

      let checkbox = makeNode("input", [{"type":"checkbox"}, {"cellText":nameCellText}, {"name":response[i].periodicalName}, {"id":response[i].periodicalId}, {"checked":"true"}, {"periodicalId":response[i].periodicalId}]);
      
      checkbox.addEventListener("click", function () {
        togglePeriodical(checkbox);
      });

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
                                  {"topicId":response[i].topicId}, {"name":response[i].name}, {"type":"checkbox"}])
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
    let loadingBarDiv = makeNode("div", [{"style":"padding: 60px;"}, {"className":"tile is-parent is-vertical box"}])
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
  let dummyText = makeDummyText()

  pencilIconCol.appendChild(pencilIcon);
  appendThese(articleDivPara, [articleDivParaSub, pencilIconCol])
  appendThese(articleDiv, [articleDivPara, dummyText])
  articleList.appendChild(articleDiv);
}

function togglePeriodical(checkbox){
    var articles = document.querySelectorAll("#listItemDiv");
    console.log(checkbox)
    console.log(articles)
    let cx = 0
    for(i=0; i<articles.length; i++){
        if(articles[i].periodicalId == checkbox.periodicalId){
            if(articles[i].classList.contains("is-hidden")){
                articles[i].classList.remove("is-hidden");
                articles[i].style.display = "block"
            }
            else{
                articles[i].classList.add("is-hidden")
                cx++
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
    let link = makeNode("a", [{"innerHTML":"<br/>Read Again <i class='fas fa-share'></i>"}, {"href":response[i].url}, {"target":"_blank"}])
    let lastViewed = document.createElement("span");
    // "date value is not finite in DateTimeFormat.format()"
    //
    let date = new Date(response[i].lastViewed);
    //
    /* let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date)
        let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
        let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date) */

    //let date = response[i].lastViewed.substr(0, 10)
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

function getTopicArticles(response) {
    makeLoadingBar(70, "Fetching articles...");
    var req = new XMLHttpRequest();
    req.open("POST", "/api/getTopicArticles", true);
    req.setRequestHeader("Content-Type", "application/json");
    req.addEventListener("load", function () {
        if (req.status >= 200 && req.status < 400) {
            setLoadingBar(90)
            var response = JSON.parse(req.responseText);
            paginate(response, 5);
            callServer("GET", "/api/getTopicArticleSources", [makePeriodicalFilter])
        } else {
            console.log("Error! " + req.statusText);
        }
    });
    let jsonObj = {
        userId: response[0].userId,
    };
    req.send(JSON.stringify(jsonObj));
}

function openArticle(id, url) {
  var req = new XMLHttpRequest();
  req.open("POST", "/api/setUserReadArticle", true);
  req.setRequestHeader("Content-Type", "application/json");
  req.addEventListener("load", function () {
    if (req.status >= 200 && req.status < 400) {
      var response = JSON.parse(req.responseText);
    } else {
      console.log("Error! " + req.statusText);
    }
  });
  let jsonObj = {
    articleId: id,
  };
  req.send(JSON.stringify(jsonObj));
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
  var indexCount = 0
  var pagNav = makeNode("nav", [{"className":"pagination"}])
  var nextPage = makeNode("a", [{"textContent":"Next"}, {"className":"pagination-next"}])
  var prevPage = makeNode("a", [{"className":"pagination-previous"}, {"textContent":"Previous"}])
  prevPage.style.visibility = "hidden";
  nextPage.style.visibility = "visible";
  if(response.length == 0){
    hide(nextPage)
    hide(prevPage)
  }
  if(indexCount + pageSize < response.length){
    makeTopicArticles(response, pageSize, indexCount)
      indexCount += pageSize;
    }
  else{
    makeTopicArticles(response, response.length, indexCount)
    indexCount += response.length
    hide(nextPage)
  }
  nextPage.onclick = function(){
    isLoadingBar = false
    if(indexCount + pageSize <= response.length){
      makeTopicArticles(response, pageSize, indexCount);
      indexCount += pageSize;
      if(indexCount == response.length){
        hide(nextPage)
      }
    }
    else{
      let remaining = response.length % pageSize
      makeTopicArticles(response, remaining, indexCount)
      hide(nextPage)
      indexCount += remaining
    }
    if(indexCount - pageSize >= 0){
      show(prevPage)
      prevPage.onclick = function(){
        isLoadingBar = false
        if(indexCount % pageSize == 0){
          indexCount -= pageSize * 2;
          makeTopicArticles(response, pageSize, indexCount)
          indexCount += pageSize;
        }
        else{
          indexCount = indexCount - pageSize - (indexCount % pageSize)
          makeTopicArticles(response, pageSize, indexCount)
          indexCount += pageSize;
        }
        if(indexCount + pageSize <= response.length){
          show(nextPage)
        }
        if(response.length % pageSize != 0 && indexCount < response.length){
          show(nextPage)
        }
        if(indexCount - pageSize <= 0){
          hide(prevPage)
        }
      }
    }
    else{
      hide(prevPage)
    }
  }
  pageDiv = clearAllAndReturn('#pagination')
  pageDiv.style.textAlign = "center"
  pagNav.appendChild(prevPage)
  pagNav.appendChild(nextPage)
  pageDiv.appendChild(pagNav)
}

function appendThese(node, childNodes){
  for(i=0;i<childNodes.length;i++){
    node.appendChild(childNodes[i])
  }
}

function makeTopicArticles(response, amount, startingIndex) {
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
            //let date = new Date(response[i].date)
            //let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date)
            //let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
            //let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date)
            //articleDate.innerText = `${month} ${day} ${year} `;

            let articleDate = makeNode("span", [{"style":"font-family: 'EB Garamond', Georgia, Times, serif;"}, {"className":"article-date is-size-6 has-text-dark"}])
            let articleDateText = document.createElement("span");
            articleDate.innerText = response[i].date.substring(0, 10);
            articleDateText.appendChild(articleDate);
            
            let readButton = makeNode("a", [{"style":"padding-right: 20px;"}, {"url":response[i].url}, {"articleId":response[i].articleId}, {"innerHTML":"Read <i class='fas fa-share'></i>"}])
            readButton.addEventListener("click", function () {
                window.open(readButton.url, "__blank");
                toggleUserArticle(readButton);
                callServer("GET", "/api/getUserArticlesHistory", [makeUserArticleHistorySidebar])
            });
           
            appender.push(function(a, b, c, d, e, f, g){
              return function(){appendThese(listItem, [a, b, c, d, e, f, g])}
            }(topic, articleTitle, articleContent, periodical, author, articleDateText, readButton));
            let listItemDiv = makeNode("div", [{"className":"tile is-parent is-vertical box"}, {"id":"listItemDiv"}, {"periodicalId":response[i].periodicalId}])
            
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
    dummyText.textContent = "wahwahwahwahwahwhahahwahwhwahahwhahwahwhhwawahwahwha"
    dummyText.className = "title";
    dummyText.style.visibility = "hidden"
    return dummyText
}

callServer("GET", "/api/getTopicArticleSources", [makePeriodicalFilter])
callServer("GET", "/api/getTopics", [makeTable], 10, "Booting up the mainframe...");
callServer("GET", "/api/getUserArticlesHistory", [makeUserArticleHistorySidebar])




