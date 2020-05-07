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

callServer("GET", "/api/getTopicArticleSources", [makePeriodicalFilter])

function getArticleSourceList(){
    var req = new XMLHttpRequest();
    req.open("GET", "/api/getTopicArticleSources", true);
    req.addEventListener("load", function () {
      if (req.status >= 200 && req.status < 400) {
        var response = JSON.parse(req.responseText);
        console.log(response);
        makePeriodicalFilter(response);
      } else {
        console.log("Error! " + req.statusText);
      }
    });
    req.send();
}

function makePeriodicalFilter(response){
    var checkboxes = [];
    var periodicalTable = document.createElement("Table");
    let thead = periodicalTable.createTHead();
    for (i = 0; i < response.length; i++) {
      let row = thead.insertRow();
      row.classList.add("periodicalRow");
  
      let nameCell = row.insertCell();
      let nameCellText = document.createElement("label");
      nameCellText.innerText = `${response[i].periodicalName}`;
      nameCell.appendChild(nameCellText);

      let numberOfArticles = row.insertCell();
      let numberOfArticlesText = document.createElement("label");
      numberOfArticlesText.innerText = `${response[i].numberOfArticles}`
      numberOfArticles.appendChild(numberOfArticlesText);
  
      let checkboxCell = row.insertCell();
  
      let checkbox = document.createElement("input");
      checkbox.cellText = nameCellText;
      checkbox.name = `${response[i].periodicalName}`;
      checkbox.checked = true
      checkbox.periodicalId = `${response[i].periodicalId}`;
      checkbox.setAttribute("type", "checkbox");
  
      checkbox.addEventListener("click", function () {
        togglePeriodical(checkbox);
      });
  
      checkbox.setAttribute("name", `${response[i].periodicalName}`);
      checkbox.setAttribute("id", `${response[i].periodicalId}`);
      nameCellText.setAttribute("for", `${response[i].periodicalName}`);
  
      checkboxes.push(checkbox);
  
      checkboxCell.appendChild(checkbox);
    }
    periodicalTable.className = "table is-child";

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
    var topicsTable = document.createElement("Table");
    let thead = topicsTable.createTHead();
    for (i = 0; i < response.length; i++) {
        let row = thead.insertRow();
        row.classList.add("topicRow");

        let cell = row.insertCell();
        let cellText = document.createElement("label");
        cellText.innerText = `${response[i].name}`;
        cell.appendChild(cellText);

        let checkboxCell = row.insertCell();

        let checkbox = document.createElement("input");
        checkbox.cellText = cellText;
        checkbox.cell = checkboxCell
        checkbox.row = row
        checkbox.name = `${response[i].name}`;
        checkbox.topicId = `${response[i].topicId}`;
        checkbox.setAttribute("type", "checkbox");

        checkbox.addEventListener("click", function () {
            event.preventDefault();
            toggleUserTopic(checkbox);
        });

        checkbox.setAttribute("name", `${response[i].name}`);
        checkbox.setAttribute("id", `${response[i].name}`);
        cellText.setAttribute("for", `${response[i].name}`);

        checkboxes.push(checkbox);

        checkboxCell.appendChild(checkbox);
    }
    topicsTable.className = "table is-child";
    var myTopics = document.querySelector("#myTopics");
    myTopics.appendChild(topicsTable);
    getUserTopics(checkboxes);
}

function getUserTopics(checkboxes) {
    setLoadingBar(30, "Fetching user topics...");
    var req = new XMLHttpRequest();
    req.open("GET", "/api/getUserTopics", true);
    req.addEventListener("load", function () {
        if (req.status >= 200 && req.status < 400) {
        var response = JSON.parse(req.responseText);
        if (response.length > 0) {
            setUserBoxes(response, checkboxes);
            getTopicArticles(response);
        } else {
            displayNoArticles();
        }
        } else {
        console.log("Error! " + req.statusText);
        }
    });
    req.send();
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
    let articleList = document.querySelector("#articleList");
    if (articleList.hasChildNodes()) {
        for (i = 0; i < articleList.children.length; i++) {
        articleList.removeChild(articleList.children[i]);
        }
    }
    let loadStatusText = document.createElement('p')
    let dummyText = makeDummyText()

    loadStatusText.classList.add("subtitle")
    loadStatusText.innerText = `${message}`
    loadStatusText.id = "loadStatusText"

    let loadingBarDiv = document.createElement('div')
    loadingBarDiv.style.padding = "60px"
    loadingBarDiv.className = "tile is-parent is-vertical box"

    let loadingBar = document.createElement('progress');
    loadingBar.id = "loadingBar"

    loadingBar.classList.add("progress")
    loadingBar.classList.add("title")

    loadingBar.value = `${initial}`
    loadingBar.textContent = `${initial}%`
    loadingBar.max = "100"

    loadingBarDiv.appendChild(loadingBar)
    loadingBarDiv.appendChild(loadStatusText)
    loadingBarDiv.appendChild(dummyText)

    articleList.appendChild(loadingBarDiv)

    isLoadingBar = true;
}

function displayNoArticles() {
  let articleList = clearAllAndReturn("#articleList");
  isLoadingBar = false
  let articleDiv = document.createElement("div");
  articleDiv.className = "tile is-parent is-vertical box";
  articleDiv.style.textAlign = "center";
  articleDiv.style.padding = "60px";

  let articleDivPara = document.createElement("p");
  articleDivPara.className = "title is-5";
  articleDivPara.innerText = "We don't have any articles for you yet!";

  let articleDivParaSub = document.createElement("p");
  articleDivParaSub.className = "subtitle is-6";
  articleDivParaSub.innerText = "Pick some topics to get started";

  let pencilIconCol = document.createElement("p");
  pencilIconCol.className = "columns is-centered";

  let pencilIcon = document.createElement("icon");
  pencilIcon.id = "noteIcon";
  pencilIcon.className = "subtitle is-6";
  pencilIcon.innerText = "📝";
  pencilIcon.className = "icon column is-centered is-large";

  let dummyText = makeDummyText()

  pencilIconCol.appendChild(pencilIcon);

  articleDivPara.appendChild(articleDivParaSub);
  articleDivPara.appendChild(pencilIconCol);
  articleDiv.appendChild(articleDivPara);
  articleDiv.appendChild(dummyText)

  articleList.appendChild(articleDiv);
}

function toggleUserTopic(checkbox) {
  var req = new XMLHttpRequest();
  var loader = document.createElement('progress')
  loader.className = "progress is-small is-dark";
  loader.max = "100"
  loader.id = "checkboxLoader"
  loader.textContent = "30%";
  checkbox.cell.replaceChild(loader, checkbox)
  req.open("POST", "/api/toggleTopic", true);
  req.setRequestHeader("Content-Type", "application/json");
  req.addEventListener("load", function () {
    if (req.status >= 200 && req.status < 400) {
      var response = JSON.parse(req.responseText);
      checkbox.cell.replaceChild(checkbox, loader)
      checkbox.checked = !checkbox.checked;
      if (response.length > 0) {
        getTopicArticles(response);
      } else {
        displayNoArticles();
      }
    } else {
      console.log("Error! " + req.statusText);
    }
  });
  let jsonObj = {
    topicId: checkbox.topicId,
  };
  req.send(JSON.stringify(jsonObj));
  return;
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

function toggleUserArticle(likeButton) {
  var req = new XMLHttpRequest();
  req.open("POST", "/api/toggleUserArticle", true);
  req.setRequestHeader("Content-Type", "application/json");
  req.addEventListener("load", function () {
    if (req.status >= 200 && req.status < 400) {
      var response = JSON.parse(req.responseText);
      if (response.length > 0) {
        getUserArticlesHistorySidebar();
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


function makeUserArticleHistorySidebar(response) {
  var ul = document.createElement("ul");
  if(response.length == 0){
      return;
  }
  for (var i = 0; i < response.length; i++) {
    let title = document.createElement("span");
    title.innerText = response[i].title;
    let linefeed = document.createElement("br");
    title.appendChild(linefeed);
    title.className = "subtitle";

    let content = document.createElement("span");
    content.innerText = response[i].content.substr(0, 100) + " ... ";
    content.className = "content sidebarBlurb";
    content.innerHTML += "<br/>";

    let link = document.createElement("a");
    link.innerHTML = '<br/>Read Again <i class="fas fa-share"></i>';
    link.href = response[i].url;
    link.target = "_blank";

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
    li.appendChild(title);
    li.appendChild(content);
    li.appendChild(lastViewed);
    li.appendChild(link);

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
            paginate(response);
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




function paginate(response){
  var indexCount = 0
  var pagNav = makeNode("nav", [{"className":"pagination"}])
  var nextPage = makeNode("a", [{"textContent":"Next"}, {"className":"pagination-next"}])

  var prevPage = document.createElement('a')
  prevPage.className = "pagination-previous"
  prevPage.textContent = "Previous"
  prevPage.style.visibility = "hidden"

  if(indexCount + 10 <= response.length){
    makeTopicArticles(response, 10, indexCount)
      indexCount += 10;
    }
  else{
    makeTopicArticles(response, response.length, indexCount)
    indexCount += response.length
  }
  nextPage.onclick = function(){
    isLoadingBar = false
    if(indexCount + 10 <= response.length){
      makeTopicArticles(response, 10, indexCount);
      indexCount += 10;
      if(indexCount == response.length){
        nextPage.style.visibility = "hidden"
      }
    }
    else{
      let amount = response.length % 10
      makeTopicArticles(response, amount, indexCount)
      nextPage.style.visibility = "hidden"
      indexCount += amount
    }
    console.log(indexCount)
    console.log(response.length)
    if(indexCount - 10 >= 0){
      if(prevPage.style.visibility == "hidden"){
        prevPage.style.visibility = "visible"
      }
      prevPage.onclick = function(){
        isLoadingBar = false
        if(indexCount % 10 == 0){
          indexCount -= 20;
          makeTopicArticles(response, 10, indexCount)
          indexCount += 10;
        }
        else{
          indexCount = indexCount - 10 - (indexCount % 10)
          makeTopicArticles(response, 10, indexCount)
          indexCount += 10;
        }
        if(indexCount + 10 <= response.length){
          if(nextPage.style.visibility == "hidden"){
            nextPage.style.visibility = "visible"
          }
        }
        if(response.length % 10 != 0 && indexCount < response.length){
          if(nextPage.style.visibility == "hidden"){
            nextPage.style.visibility = "visible"
          }
        }
        if(indexCount - 10 <= 0){
          if(prevPage.style.visibility == "visible"){
            prevPage.style.visibility = "hidden"
          }
        }
        console.log(indexCount)
      }
    }
    else{
      prevPage.style.visibility = "hidden"
    }
  }
  pageDiv = clearAllAndReturn('#pagination')
  pageDiv.style.textAlign = "center"
  pagNav.appendChild(prevPage)
  pagNav.appendChild(nextPage)
  pageDiv.appendChild(pagNav)
}

function makeTopicArticles(response, amount, startingIndex) {
  setLoadingBar(90, "Generating list...");

  var list = document.createElement("ul");
  if (response.length == 0) {
    displayNoArticles();
  } else {
        for (i = startingIndex; i < startingIndex + amount; i++) {
            let listItem = document.createElement("li");
            let topic = makeNode("span", [{"className":"is-size-7 is-uppercase is-block"}, {"innerText":response[i].topic}])
            //let topic = document.createElement("span");
            listItem.appendChild(topic);

            let articleTitle = document.createElement("p");
            articleTitle.className =
                "article-title is-size-5 has-text-weight-bold has-text-dark";
            articleTitle.innerText = response[i].title;
            listItem.appendChild(articleTitle);

            let articleContent = document.createElement("p");
            articleContent.className = "article-content is-size-6 has-text-grey-dark";
            articleContent.innerText = response[i].content;
            listItem.appendChild(articleContent);

            let periodical = document.createElement("a");
            periodical.innerText = response[i].periodicalName;
            periodical.href = response[i].periodicalUrl;
            periodical.target = "_blank";
            periodical.className = "periodical is-size-6 has-text-dark";
            listItem.appendChild(periodical);

            let author = document.createElement("span");
            author.innerText = ` ${response[i].firstName} ${response[i].lastName}`;
            author.className = "author is-size-6 has-text-dark";
            listItem.appendChild(author);

            let articleDate = document.createElement("span");
            articleDate.style.fontFamily = "'EB Garamond', Georgia, Times, serif";
            articleDate.className = "article-date is-size-6 has-text-dark";
            let articleDateText = document.createElement("span");
            //let date = new Date(response[i].date)

            //let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date)
            //let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
            //let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date)

            //articleDate.innerText = `${month} ${day} ${year} `;
            articleDate.innerText = response[i].date.substring(0, 10);
            articleDateText.appendChild(articleDate);
            listItem.appendChild(articleDateText);

            let readButton = document.createElement("a");
            readButton.style.paddingRight = "20px";
            readButton.url = response[i].url;
            readButton.articleId = response[i].articleId;
            readButton.addEventListener("click", function () {
                window.open(readButton.url, "__blank");
                toggleUserArticle(readButton);
            });
            readButton.innerHTML = 'Read <i class="fas fa-share"></i>';
            listItem.appendChild(readButton);

            let listItemDiv = document.createElement("div");
            listItemDiv.className = "tile is-parent is-vertical box";
            listItemDiv.id = "listItemDiv";
            listItemDiv.periodicalId = response[0].periodicalId;
            listItemDiv.appendChild(listItem);
            list.appendChild(listItemDiv);
        }
        let dummyText = makeDummyText()
        let icon = document.createElement('icon')
        iconCol = document.createElement('p')
        iconCol.className = "columns tile is-parent"
        iconCol.id = "iconCol"
        icon.innerText = "📰";
        icon.className = "icon column is-centered is-large";
        icon.style.paddingBottom = "60px"
        icon.id = "noteIcon"
        iconCol.appendChild(icon)
        list.appendChild(iconCol)
        list.appendChild(dummyText)
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

callServer("GET", "/api/getTopics", [makeTable], 10, "Booting up the mainframe...");
callServer("GET", "/api/getUserArticlesHistory", [makeUserArticleHistorySidebar])




